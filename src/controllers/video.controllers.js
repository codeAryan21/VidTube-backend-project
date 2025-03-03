import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
    page = parseInt(page)
    limit = parseInt(limit)

    if (page <= 0 || limit <= 0) {
        throw new ApiError(400, "Page and limit must be positive number");
    }

    const filter = {}; // filter is an object that will hold the search criteria for the query
    if (query) { // This code will execute only when we search anything in the params like (?query=whatYouWantToSearch)
        filter.$or = [ // Here it checks what you search in the title and description 
            { title: { $regex: query, $options: 'i' } }, // either it found in title or description it simply returns the matched record
            { description: { $regex: query, $options: 'i' } },// {$options: 'i'} is used for case-insensitivity
        ]
    }

    // Add owner filter if user is authenticated
    if (req.user && req.user._id) {
        filter.owner = req.user._id; // Only return videos owned by the authenticated user
    }

    const sort = {}
    sort[sortBy] = sortType === 'asc' ? 1 : -1 // const sort = { [sortBy]: sortType === 'asc' ? 1 : -1 };

    const allVideos = await Video.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sort)
        .select("-__v -updatedAt")
        .populate("owner", "username fullName") // This is optional depends on u
        .exec()

    const totalVideos = await Video.countDocuments(filter)
    const totalPages = Math.ceil(totalVideos / limit)

    if (page > totalPages) {
        throw new ApiError(400, "Page exceeds total pages");
    }

    return res.status(200).json(new ApiResponse(200, { allVideos, currentPage: page, totalPages, totalVideos, pageLimit: limit }, "Successfully fetched the videos"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLoaclPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnailLoaclPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    let videoFile;
    let thumbnail
    try {
        videoFile = await uploadOnCloudinary(videoFileLocalPath);
        console.log("VideoFile uploaded successfully : ", videoFile);

        thumbnail = await uploadOnCloudinary(thumbnailLoaclPath)
        console.log("Thumbnail uploaded successfully : ", thumbnail);
    } catch (error) {
        console.log("Error while uploading files : ", error)

        if (videoFile) {
            const publicId = videoFile.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId, "video")
        }

        if (thumbnail) {
            const publicId = thumbnail.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId, "image")
        }

        throw new ApiError(500, "Error while uploading video, files were deleted");
    }

    let duration = Math.round(videoFile.duration)

    try {
        // Making a new entry in the database
        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: req.user._id,
            duration
        })

        const videoUpload = await Video.findById(video._id).select("-__v").populate("owner", "username fullName avtar")
        if (!videoUpload) {
            throw new ApiError(500, "Something went wrong while publishing the video")
        }

        return res.status(200).json(new ApiResponse(200, videoUpload, "Video published successfully"));
    } catch (error) {
        console.log("Error while uploading videos : ", error)

        // Cleanup the file from the cloudinary
        if (videoFile) {
            const publicId = videoFile.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId, "video")
        }

        if (thumbnail) {
            const publicId = thumbnail.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId, "image")
        }

        // This is the alternate method for deleting file from cloudinary
        // if(videoFile){
        //     await deleteFromCloudinary(videoFile.public_id,"video") // this directly get public_id from videoFile
        // }

        // if(thumbnail){
        //     await deleteFromCloudinary(thumbnail.public_id,"image")
        // }

        throw new ApiError(500, "Error while uploading video, videoFile and thumbnail were deleted");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid")
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName avtar")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const totalLike = await Like.countDocuments({ video: videoId })
    return res.status(200).json(new ApiResponse(200, { video, totalLike }, "Successfully fetched the video by ID"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid")
    }

    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(400, "title and description are required")
    }

    const thumbnailLoacalPath = req.file?.path
    if (!thumbnailLoacalPath) {
        throw new ApiError(400, "Thumbnail is missing")
    }

    // Deleting the previous thumbnail
    const prevThumbnail = await Video.findById(videoId).select("thumbnail");
    if (prevThumbnail.thumbnail) {
        const publicId = prevThumbnail.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId, "image")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // This ensure that only owner can update the video detail
    if (video.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to delete this video")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLoacalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail")

    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        }, { new: true })

    if (!updateVideo) {
        throw new ApiError(500, "Something went wrong while updating video detail")
    }

    return res.status(200).json(new ApiResponse(200, updateVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to delete this video")
    }

    // First we delete files from the cloudinary
    if (video.videoFile) {
        const publicId = video.videoFile.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId, "video")
    }

    if (video.thumbnail) {
        const publicId = video.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId, "image")
    }

    // Then delete the data from the database
    const deleteVideo = await Video.deleteOne({ _id: videoId })
    if (!deleteVideo) {
        throw new ApiError(500, "Error while deleting video")
    }

    return res.status(200).json(new ApiResponse(200, deleteVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid")
    }

    // find video in database
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to toggle this video")
    }

    // toggle publish status
    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, video, "Successfully toggle the video"))
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }
