import { Response, Request } from "express";
import mongoose from "mongoose";
import { SubComment } from "../models/subComment.model";
import { asyncHandler } from "../utils/function";
import { Comment } from "../models/comment.model";

//Add subcomment------------------
export const addNewSubComment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { commentId, content } = req.body;
      const userId = req.user?.user_id;
      // Convert commentId and userId to ObjectId
      const commentObjectId = new mongoose.Types.ObjectId(commentId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Check if the parent comment exists
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          status: 404,
          message: "Parent comment not found.",
          data: null,
          error: "Invalid comment ID.",
        });
      }

      // Create a new subcomment
      const subComment = new SubComment({
        commentId: commentObjectId,
        userId: userObjectId,
        content,
      });

      const savedSubComment = await subComment.save();

      // Update the parent comment
      const updatedComment = await Comment.findByIdAndUpdate(
        commentObjectId,
        { $push: { subCommentsIds: savedSubComment._id } }, // _id is already an ObjectId
        { new: true }
      );

      return res.status(201).json({
        status: 201,
        message: "Subcomment added successfully.",
        data: savedSubComment,
        error: null,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//Update the subcomment
export const updateSubComment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subCommentId } = req.params;
      const { commentId, content } = req.body;
      const userId = req.user?.user_id;
      const subComment = await SubComment.findById(subCommentId);
      if (!subComment) {
        return res.status(404).json({
          status: 404,
          data: null,
          message: "Subcomment not found.",
          error: null,
        });
      }
      //User to remove the old subcomment
      await Comment.findByIdAndUpdate(
        subComment?.commentId,
        {
          $pull: {
            subCommentsIds: subComment?._id,
          },
        },
        { new: true } // Return the updated document
      );

      const updateSubComment = await SubComment.findByIdAndUpdate(
        subCommentId,
        {
          $set: {
            commentId,
            userId,
            content,
          },
        },
        {
          new: true,
        }
      );
      if (updateSubComment) {
        return res.status(200).json({
          status: 200,
          data: updateSubComment,
          message: "The sub comment has been updated successfully.",
          error: null,
        });
      } else {
        return res.status(200).json({
          status: 200,
          data: null,
          message: null,
          error: "Sorry, the sub comment can not be updated.",
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//Delete the subcomment-------------------
export const deleteSubComment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subCommentId } = req.params;
      const subComment = await SubComment.findById(subCommentId);
      if (!subComment) {
        return res.status(404).json({
          status: 404,
          data: null,
          message: "Subcomment not found.",
          error: null,
        });
      }
      const deleteSubCommentDetails = await SubComment.findByIdAndDelete(
        subCommentId
      );
      await Comment.findByIdAndUpdate(
        subComment?.commentId,
        {
          $pull: {
            subCommentsIds: subComment?._id,
          },
        },
        { new: true } // Return the updated document
      );
      if (deleteSubCommentDetails) {
        return res.status(200).json({
          status: 200,
          data: null,
          message: "The comment has been deleted successfully.",
          error: null,
        });
      } else {
        return res.status(500).json({
          status: 500,
          data: null,
          message: null,
          error: "Sorry, the sub comment can not be deleted.",
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//Used to get the subcomment details based on ID.
export const getSubCommentByID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subCommentId } = req.params;

      const subCommentDetails = await SubComment.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(subCommentId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "commentId",
            foreignField: "_id",
            as: "CommentDetails",
          },
        },
        {
          $unwind: {
            path: "$CommentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            content: 1,
            userId: 1,
            commentId: 1,
            "userDetails._id": 1,
            "userDetails.userName": 1,
            "userDetails.email": 1,
            "userDetails.fullName": 1,
            "CommentDetails._id": 1,
            "CommentDetails.content": 1,
          },
        },
      ]);
      if (subCommentDetails) {
        return res.status(200).json({
          status: 200,
          message: "The subcomment details",
          data: subCommentDetails,
          error: null,
        });
      } else {
        return res.status(404).json({
          status: 404,
          message: null,
          data: null,
          error: "Sorry no sub comment found",
        });
      }
    } catch (err) {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

// Used to set the status of the subcomment
export const softDeletedComment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subCommentId } = req.params;
      const updateSubCommentStatus = await SubComment.findByIdAndUpdate(
        subCommentId,
        {
          $set: {
            isDeleted: true,
          },
        }
      );
      if (updateSubCommentStatus) {
        return res.status(200).json({
          status: 200,
          message: "The subcomment has been deleted successfully.",
          data: null,
          error: null,
        });
      } else {
        return res.status(500).json({
          status: 500,
          message: null,
          data: null,
          error: "Sorry, the subcomment can not be deleted.",
        });
      }
    } catch (err) {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);
