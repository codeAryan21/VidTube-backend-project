import mongoose, { startSession } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id 

    const totalSubscriber = await Subscription.countDocuments({ channel: userId }) || 0;
    const totalVideo = await Video.countDocuments({ owner: userId}) || 0;

    // Fetch all videos owned by userId and extract only the _id field.
    const video = await Video.find({ owner: userId}).distinct("_id");

    // Counts how many times the video appear in the Like collection {$in: video} → Checks if video in the Like collection matches any video in video.
    const totalVideoLike = await Like.countDocuments({ video: {$in: video}});

    const views = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views"}
            }
        }
    ])

    const totalViews = views[0]?.totalViews || 0;

    const stats = {
        totalSubscriber,
        totalVideo,
        totalVideoLike,
        totalViews
    }

    return res.status(200).json(new ApiResponse(200,stats,"Successfully fetched the channel stats"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id 

    const channelVideo = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1
            }
        }
    ])
    if(channelVideo.length == 0){
        throw new ApiError(404,"Channel video not found")
    }

    const totalVideo = await Video.countDocuments({ owner: userId})
    
    return res.status(200).json(new ApiResponse(200,{ channelVideo, totalVideo },"Successfully fetched the channel videos"))
})

export { getChannelStats, getChannelVideos }