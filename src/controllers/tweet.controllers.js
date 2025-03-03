import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const userId = req.user._id

     // Validation
     if (typeof content !== 'string' || content.trim() === "") {
        throw new ApiError(400, "Content is required and must be a string");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    const createdTweet = await Tweet.findById(tweet._id);
    if (!createdTweet) {
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res.status(200).json(new ApiResponse(200, createdTweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User ID is not valid");
    }

    const userTweet = await Tweet.find({ owner: userId })
    if (!userTweet) {
        throw new ApiError(404, "User tweet not found");
    }

    const totalTweet = await Tweet.countDocuments(userTweet)

    return res.status(200).json(new ApiResponse(200,{ userTweet, totalTweet }, "Successfully fetched the user tweet"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet ID is not valid");
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404,"Tweet not found")
    }

    if (tweet.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to update this tweet")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        }, { new: true }
    )
    if (!updateTweet) {
        throw new ApiError(500, "Error while updating the tweet")
    }

    return res.status(200).json(new ApiResponse(200, updateTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet ID is not valid");
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404,"Tweet not found")
    }

    if (tweet.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400, "You doesn't have permission to delete this tweet")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId )
    if (!deleteTweet) {
        throw new ApiError(500, "Error while deleting the tweet")
    }

    return res.status(200).json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"));
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
