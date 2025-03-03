import mongoose,{ isValidObjectId }from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    let {page = 1, limit = 10} = req.query
    page = parseInt(page)
    limit = parseInt(limit)

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video ID is not valid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    
    const videoComment = await Comment.find({ video: videoId})
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("owner","username avatar")
    .exec()

    if(!videoComment){
        throw new ApiError(404,"Video comments not found")
    }

    const totalComment = await Comment.countDocuments({ video: videoId})

    return res.status(200).json(new ApiResponse(200,{ videoComment, totalComment},"Successfully fetched the video comments"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video ID is not valid")
    }

    const { content } = req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }
    const userId = req.user._id;

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })
    const createdComment = await Comment.findById(comment._id).populate("owner", "username avatar");
    if(!createdComment){
        throw new ApiError(500,"Something went wrong while creating comment")
    }

    return res.status(200).json(new ApiResponse(200,createdComment,"Comment created successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Comment ID is not valid")
    }

    const { content } = req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment.owner.toString() != req.user._id.toString()){
        throw new ApiError(400,"You doesn't have permission to update this comment")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },{ new: true }
    )
    if(!updateComment){
        throw new ApiError(500,"Error while updating comment")
    }

    return res.status(200).json(new ApiResponse(200,updateComment,"Comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Comment ID is not valid")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment.owner.toString() != req.user._id.toString()){
        throw new ApiError(400,"You doesn't have permission to delete this comment")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)
    if(!deleteComment){
        throw new ApiError(500,"Error while deleting comment")
    }

    return res.status(200).json(new ApiResponse(200,null,"Comment deleted successfully"));
})

export { getVideoComments, addComment, updateComment, deleteComment }