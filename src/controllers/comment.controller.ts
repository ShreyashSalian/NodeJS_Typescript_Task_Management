import Redis from "ioredis";
import { Comment } from "../models/comment.model";
import {
  asyncHandler,
  buildSearchPaginationSortingPipeline,
} from "../utils/function";
import { Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { Task } from "../models/task.model";
//Used to add the comment
export const addNewComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId, content } = req.body;
    const author = req.user?.user_id;
    const commentCreation = await Comment.create({
      taskId,
      author,
      content,
    });
    // Update the parent comment
    await Task.findByIdAndUpdate(
      taskId,
      { $push: { commentsIds: commentCreation._id } }, // _id is already an ObjectId
      { new: true }
    );

    if (commentCreation) {
      return res.status(200).json({
        status: 200,
        data: commentCreation,
        message: "The comment has been added successfully.",
        error: null,
      });
    } else {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Sorry, the comment can not be added.",
      });
    }
  }
);

//Update the comment-----------
export const updateComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { taskId, content } = req.body;
    const author = req.user?.user_id;
    const updateCommentDetails = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          taskId,
          author,
          content,
        },
      },
      {
        new: true,
      }
    );

    if (updateCommentDetails) {
      return res.status(200).json({
        status: 200,
        data: updateCommentDetails,
        message: "The comment has been updated successfully.",
        error: null,
      });
    } else {
      return res.status(500).json({
        status: 500,
        data: null,
        message: "Sorry, the comment can not be updated.",
        error: null,
      });
    }
  }
);

//Delete the comment----------------
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const deleteCommentDetail = await Comment.findByIdAndDelete(commentId);
    if (deleteCommentDetail) {
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
        error: "Sorry, the comment can not be deleted.",
      });
    }
  }
);

//List all the task----------

interface ListAllCommentRequest extends Request {
  body: {
    search?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: "asc" | "desc";
  };
}
// List all comments with sorting pagination
export const listAllComments = asyncHandler(
  async (req: ListAllCommentRequest, res: Response) => {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
        sortField = "content",
        sortOrder = "asc",
      } = req.body;

      //Initialize the redis client
      const client = new Redis();
      client.on("error", (err) => {
        console.log("Redis connection error", err);
      });

      const currentPage = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const cacheKey = `comments_${search}_${currentPage}_${pageSize}_${sortField}_${sortOrder}`;

      //Check redis cache
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          status: 200,
          message: "Comments fetched from cache.",
          data: JSON.parse(cachedData),
          error: null,
        });
      }
      const searchFields = [
        "content",
        "authorDetails.userName",
        "authorDetails.email",
      ];
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDetails",
          },
        },
        {
          $unwind: {
            path: "$authorDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            content: 1,
            "authorDetails.userName": 1,
            "authorDetails.email": 1,
            "authorDetails.fullName": 1,
          },
        },
        ...buildSearchPaginationSortingPipeline(
          searchFields,
          search as string,
          sortField as string,
          sortOrder,
          currentPage,
          pageSize
        ),
      ];

      const commentAggregation = await Comment.aggregate(pipeline);

      //Get total count for pagination
      const totalCountPipeline = pipeline.filter(
        (stage) => !("$skip" in stage || "$limit" in stage)
      );
      const totalTaskResult = await Comment.aggregate([
        ...totalCountPipeline,
        { $count: "totalCount" },
      ]);
      const totalComment = totalTaskResult[0]?.totalCount || 0;

      if (commentAggregation.length === 0) {
        return res.status(200).json({
          status: 200,
          message: "No Comment found",
          data: { tasks: [], totalComment, totalPages: 0, currentPage },
          error: null,
        });
      }
      const responseData = {
        comments: commentAggregation,
        totalComment,
        totalPages: Math.ceil(totalComment / pageSize),
        currentPage,
      };

      // Cache data in Redis
      await client.set(cacheKey, JSON.stringify(responseData), "EX", 30); // Cache expires in 30 seconds

      return res.status(200).json({
        status: 200,
        message: "Comments fetched from database.",
        data: responseData,
        error: null,
      });
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({
        status: 500,
        message: "Error fetching tasks.",
        data: null,
        error: error.message,
      });
    }
  }
);
