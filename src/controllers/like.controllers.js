import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    const userId = req.user._id // Assuming you have user information in req.user

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is not Valid")
    }

    const likeExist = await Like.findOne({ video: videoId, likedBy: userId })

    if (likeExist) {
        // If like exists, remove it (unlike)
        await Like.deleteOne({ _id: likeExist._id })
        const totalLike = await Like.countDocuments({ video: videoId })
        res.status(200).json(new ApiResponse(200, { totalLike }, "Successfully remove like from video"))
    } else {
        // If like does not exist, create it (like)
        const addLike = await Like.create({ video: videoId, likedBy: userId });
        const totalLike = await Like.countDocuments({ video: videoId })
        res.status(200).json(new ApiResponse(200, { addLike, totalLike }, "Successfully add like to video"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment Id is not Valid")
    }

    const likeExist = await Like.findOne({ comment: commentId, likedBy: userId })

    if (likeExist) {
        // If like exists, remove it (unlike)
        await Like.deleteOne({ _id: likeExist._id })
        const totalLike = await Like.countDocuments({ comment: commentId })
        res.status(200).json(new ApiResponse(200, { totalLike }, "Successfully remove like from comment"))
    } else {
        // If like does not exist, create it (like)
        const addLike = await Like.create({ comment: commentId, likedBy: userId });
        const totalLike = await Like.countDocuments({ comment: commentId })
        res.status(200).json(new ApiResponse(200, { totalLike }, "Successfully add like to comment"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweet Id is not Valid")
    }

    const likeExist = await Like.findOne({ tweet: tweetId, likedBy: userId })

    if (likeExist) {
        // If like exists, remove it (unlike)
        await Like.deleteOne({ _id: likeExist._id })
        const totalLike = await Like.countDocuments({ tweet: tweetId })
        res.status(200).json(new ApiResponse(200, { totalLike }, "Successfully remove like from tweet"))
    } else {
        // If like does not exist, create it (like)
        const addLike = await Like.create({ tweet: tweetId, likedBy: userId });
        const totalLike = await Like.countDocuments({ tweet: tweetId })
        res.status(200).json(new ApiResponse(200, { totalLike }, "Successfully add like to tweet"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null } // This ensures that video field is not equal to null means Like document must have a valid video associated with it.
            }
        },
        {
            $unset: [ "__v", "updatedAt" ]
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetail",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1, // fullName is optional
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    // {
                    //     $project: {
                    //         title: 1,
                    //         description: 1,
                    //         thumbnail: 1,
                    //         videoFile: 1,
                    //         duration: 1,
                    //         createdAt: 1,
                    //         owner: "$videoOwner"
                    //     }
                    // },

                    // [ Both the above $project and below $unset will do the same work you can use anything ]

                    {
                        $unset: [ "__v", "updatedAt", "owner", "isPublished", "views"]
                    }
                ]
            }
        }
    ])

    if (likedVideo.length == 0) {
        throw new ApiError(404, "Liked videos not found")
    }

    // Count the total liked video
    const totalLikedVideo = await Like.countDocuments({
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $ne: null }
    })

    return res.status(200).json(new ApiResponse(200,{ likedVideo, totalLikedVideo }, "Successfully fetched the liked videos"))
})


export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }