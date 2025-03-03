import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(400, "Name and description is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        videos: []
    })
    const createdPlaylist = await Playlist.findById(playlist._id)

    if (!createdPlaylist) {
        throw new ApiError(500, "Something went wrong while creating the playlist")
    }

    return res.status(200).json(new ApiResponse(200, createdPlaylist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User ID is not valid");
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users", // Name of the users collection
                localField: "owner", // Field from the playlist collection to match
                foreignField: "_id", // Field in the users collection to match
                as: "playlistOwner", // Alias for the joined result
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            description: 1,
                            videos: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,  // Include videos in the output
                playlistOwner: "$playlistOwner"
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" } // Add a new field with the count of videos in the playlist
            }
        }
    ])

    if (!userPlaylist.length) {
        throw new ApiError(404, "User playlist doesn't exist");
    }

    const totalPlaylist = await Playlist.countDocuments({ owner: req.user._id })

    return res.status(200).json(new ApiResponse(200,{ userPlaylist, totalPlaylist }, "Successfully fetched the user playlist"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist ID is not valid");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Get the total number of videos in the playlist
    const totalVideos = playlist.videos.length;

    return res.status(200).json(new ApiResponse(200,{ playlist, totalVideos }, "Successfully fetched the user playlist"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist ID is not valid");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to add video to this playlist")
    }

    // Check if the video already exists in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in this playlist");
    }

    // Add video to the playlist
    const addVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        }, { new: true }
    )

    if (!addVideo) {
        throw new ApiError(500, "Something went wrong while adding video to this playlist");
    }
    /*
        // Add video to the playlist
        playlist.videos.push(videoId); // This is the another method
        await playlist.save();
    
    */

    return res.status(200).json(new ApiResponse(200, addVideo, "Successfully added this video to playlist"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist ID is not valid");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to remove video from this playlist")
    }

    // Check if the video already exists in the playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video doesn't exist in this playlist");
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },{ new: true}
    )
    if (!removeVideo) {
        throw new ApiError(500, "Error while removing video from playlist")
    }

    return res.status(200).json(new ApiResponse(200, removeVideo, "Successfully remove the video from playlist"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist ID is not valid");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to delete this playlist")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)
    if (!deletePlaylist) {
        throw new ApiError(500, "Error while deleting the playlist")
    }

    return res.status(200).json(new ApiResponse(200, deletePlaylist, "Successfully deleted the playlist"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist ID is not valid");
    }

    if (!name || !description) {
        throw new ApiError(400, "Name and description is required");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to update this playlist")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        }, { new: true }
    )
    if (!updatePlaylist) {
        throw new ApiError(500, "Error while updating the playlist")
    }

    return res.status(200).json(new ApiResponse(200, updatePlaylist, "Successfully updated the playlist"));
})

export { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist }
