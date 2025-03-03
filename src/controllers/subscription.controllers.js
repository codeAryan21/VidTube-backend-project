import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const userId = req.user._id
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel ID is not valid");
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    if (channelId.toString() == userId.toString()) {
        throw new ApiError(400, "You can not subscribe to your own channel")
    }

    const subscribeExist = await Subscription.findOne({ channel: channelId, subscriber: userId })

    if (subscribeExist) {
        await Subscription.deleteOne({ _id: subscribeExist._id })
        const totalsubscriber = await Subscription.countDocuments({ channel: channelId})
        return res.status(200).json(new ApiResponse(200, { totalsubscriber }, "Successfully unsubscribe the channel"));
    } else {
        const addSubscribe = await Subscription.create({ channel: channelId, subscriber: userId })
        const totalsubscriber = await Subscription.countDocuments({ channel: channelId})
        return res.status(200).json(new ApiResponse(200,{ addSubscribe, totalsubscriber }, "Successfully subscribe the channel"))
    }
})

// Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel ID is not valid");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Get the channel Subscribers
    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "username fullname avatar");
    const totalsubscriber = await Subscription.countDocuments({ channel: channelId})
    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found for this channel");
    }

    return res.status(200).json(new ApiResponse(200,{ subscribers, totalsubscriber }, "Successfully fetched the channel subscribers"));
});

// Controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Subscriber ID is not valid");
    }

    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    if(subscriberId.toString() != req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to see to subscribed channel list")
    }

    // Get the  Subscribed Channels
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username fullname avatar");
    const subscribedToChannel = await Subscription.countDocuments({ subscriber: subscriberId})
    if (!subscribedChannels || subscribedChannels.length === 0) {
        throw new ApiError(404, "No channels found for this subscriber");
    }

    // Return response
    return res.status(200).json(new ApiResponse(200,{ subscribedChannels, subscribedToChannel },"Successfully fetched the subscribed channels"));
});

export { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription }