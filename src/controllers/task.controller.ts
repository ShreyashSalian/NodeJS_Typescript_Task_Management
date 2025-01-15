import { Request, Response } from "express";
import { Task } from "../models/task.model";
import mongoose, { PipelineStage } from "mongoose";

import {
  asyncHandler,
  buildSearchPaginationSortingPipeline,
} from "../utils/function";
import { Project } from "../models/project.model";
import path from "path";
import fs from "fs";
import { Redis } from "ioredis";
// Typing for Express Request with multiple file uploads
interface RequestWithFiles extends Request {
  files: {
    attachment?: Express.Multer.File[];
    completedTaskAttachment?: Express.Multer.File[];
  };
}

// POST => This function is used to add new task.
export const addNewTask = asyncHandler(async (req: Request, res: Response) => {
  const customReq = req as RequestWithFiles;

  const {
    title,
    description,
    status,
    priority,
    assignee,
    assigner,
    assoicatedProject,
    startDate,
    dueDate,
  } = customReq.body;

  const checkTaskAlreadyAssignedToDeveloper = await Task.findOne({
    $and: [
      {
        assigner: assigner,
      },
      {
        assoicatedProject: assoicatedProject,
      },
    ],
  });
  if (checkTaskAlreadyAssignedToDeveloper) {
    return res.status(404).json({
      status: 404,
      message: null,
      data: null,
      error:
        "The user already has been assigned the task for the given project.",
    });
  }

  // Handle file uploads
  const attachments: string[] | null =
    customReq.files && customReq.files.attachment
      ? customReq.files.attachment.map((file) => file.filename)
      : null;

  const completedAttachments: string[] | null =
    customReq.files && customReq.files.completedTaskAttachment
      ? customReq.files.completedTaskAttachment.map((file) => file.filename)
      : null;

  // Create new task
  const newTask = new Task({
    title,
    description,
    status,
    priority,
    assignee,
    assigner,
    startDate,
    dueDate,
    assoicatedProject,
    attachment: attachments,
    completedTaskAttachment: completedAttachments,
  });

  try {
    const savedTask = await newTask.save();
    console.log(savedTask);

    await Project.findOneAndUpdate(
      { _id: assoicatedProject },
      {
        $addToSet: { associatedTask: savedTask?._id },
      }
      // {
      //   $set: {
      //     name: "testing",
      //   },
      // }
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: savedTask,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Failed to create task",
      error: error.message,
    });
  }
});

//POST => This function is used to delete one or more images of the attachment added to the task.
export const deleteMultipleImages = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { attachmentImages } = req.body;

    if (!Array.isArray(attachmentImages) || attachmentImages.length === 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        message: null,
        error: "No images have been provided.",
      });
    }

    // Find the task
    const existTask = await Task.findById(taskId);
    if (!existTask) {
      return res.status(404).json({
        status: 404,
        message: null,
        data: null,
        error: "Sorry, no task found with the given task ID.",
      });
    }

    // Filter out the images that are not in the task attachment array
    const validImages = attachmentImages.filter((image) =>
      existTask.attachment.includes(image)
    );

    if (validImages.length === 0) {
      return res.status(400).json({
        status: 400,
        message: null,
        data: null,
        error: "No valid images to delete.",
      });
    }

    // Delete the images from the filesystem
    const deletePromises = validImages.map(async (image) => {
      const filePath = path.resolve(
        __dirname,
        "../../public/attachment",
        image
      ); // Use absolute path
      try {
        await fs.unlink(filePath, (err) => {
          if (err) {
            console.log(err);
          }
        }); // Use async unlink
      } catch (err: any) {
        console.error(`Failed to delete the image: ${image}`, err);
      }
    });

    await Promise.all(deletePromises); // Wait for all files to be deleted

    // Remove the images from the task's attachment array
    existTask.attachment = existTask.attachment.filter(
      (image) => !validImages.includes(image)
    );

    await existTask.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Images deleted successfully",
      deletedImages: validImages,
    });
  }
);

//POST => This function is used to delete one or more images of the completed attachment images added to the task.
export const deleteMultiplCompletedTaskAttachmentImages = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { completedTaskAttachmentImages } = req.body;
      if (
        !Array.isArray(completedTaskAttachmentImages) ||
        completedTaskAttachmentImages.length === 0
      ) {
        return res.status(400).json({
          status: 400,
          data: null,
          message: null,
          error: "No completed task attachment have been provided.",
        });
      }
      // Find the task
      const existTask = await Task.findById(taskId);
      if (!existTask) {
        return res.status(404).json({
          status: 404,
          message: null,
          data: null,
          error: "Sorry, no task found with the given task ID.",
        });
      }
      //----------Filter out the image that are not in the task attachment array---------
      const validImages = completedTaskAttachmentImages.filter((images) => {
        existTask.completedTaskAttachment.includes(images);
      });

      if (validImages.length === 0) {
        return res.status(400).json({
          status: 400,
          message: null,
          data: null,
          error: "No valid image to delete.",
        });
      }
      //Delete the images from the fileSystem
      const deleteImagesList = validImages.map(async (image) => {
        const filePath = path.resolve(
          __dirname,
          "../../public/attachment",
          image
        );
        try {
          await fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
            }
          });
        } catch (err: any) {
          console.error(`Failed to delete the image: ${image}`, err);
        }
      });
      await Promise.all(deleteImagesList);
      //--------Remove the images from the task's completed task attachment array
      existTask.completedTaskAttachment =
        existTask.completedTaskAttachment.filter(
          (image) => !validImages.includes(image)
        );
      await existTask.save({ validateBeforeSave: false });
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

//PUT => This function is used to update the details of the task based on given ID.
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const {
    title,
    description,
    status,
    priority,
    assignee,
    assigner,
    assoicatedProject,
    startDate,
    dueDate,
  } = req.body;

  const updateTaskDetails = await Task.findByIdAndUpdate(
    taskId,
    {
      $set: {
        title,
        description,
        status,
        priority,
        assignee,
        assigner,
        assoicatedProject,
        startDate,
        dueDate,
      },
    },
    {
      new: true,
    }
  );

  if (updateTaskDetails) {
    res.status(201).json({
      success: true,
      message: "Task updated successfully",
      data: updateTaskDetails,
      error: null,
    });
  } else {
    res.status(500).json({
      success: true,
      message: null,
      data: null,
      error: "The task can not be updated.",
    });
  }
});

//DELETE => This function is used to delete the task based on ID.
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const deleteTaskDetails = await Task.findByIdAndDelete(taskId);
  if (deleteTaskDetails) {
    return res.status(200).json({
      status: 200,
      message: "The task has been deleted successfully.",
      data: null,
      error: null,
    });
  } else {
    return res.status(500).json({
      status: 500,
      message: null,
      data: null,
      error: "The task has not been deleted.",
    });
  }
});

//GET => This function the details of the given task.
export const getTaskByID = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid task ID format.",
        error: "Invalid ID",
        data: null,
      });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        status: 404,
        message: null,
        error: "Sorry, no task found",
        data: null,
      });
    }
    console.log(task);

    const taskAggregation = await Task.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(taskId) },
      },
      {
        $lookup: {
          from: "projects",
          localField: "assoicatedProject",
          foreignField: "_id",
          as: "projectDetails",
        },
      },
      {
        $unwind: {
          path: "$projectDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignee",
          foreignField: "_id",
          as: "assigneeDetails",
        },
      },
      {
        $unwind: {
          path: "$assigneeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assigner",
          foreignField: "_id",
          as: "assignerDetails",
        },
      },
      {
        $unwind: {
          path: "$assignerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "taskId",
          as: "commentDetails",
        },
      },
      {
        $unwind: {
          path: "$commentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentDetails.author",
          foreignField: "_id",
          as: "commentDetails.authorDetails",
        },
      },
      {
        $unwind: {
          path: "$commentDetails.authorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subcomments",
          localField: "commentDetails.subCommentsIds",
          foreignField: "_id",
          as: "commentDetails.subComments",
        },
      },
      {
        $unwind: {
          path: "$commentDetails.subComments",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentDetails.subComments.userId",
          foreignField: "_id",
          as: "commentDetails.subComments.subCommentAuthorDetails",
        },
      },
      {
        $unwind: {
          path: "$commentDetails.subComments.subCommentAuthorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          status: 1,
          priority: 1,
          startDate: 1,
          dueDate: 1,
          "projectDetails.name": 1,
          "projectDetails.description": 1,
          "assigneeDetails.fullName": 1,
          "assigneeDetails.userName": 1,
          "assigneeDetails.email": 1,
          "assignerDetails.fullName": 1,
          "assignerDetails.email": 1,
          "assignerDetails.userName": 1,
          "commentDetails._id": 1,
          "commentDetails.content": 1,
          "commentDetails.author": 1,
          "commentDetails.authorDetails._id": 1,
          "commentDetails.authorDetails.fullName": 1,
          "commentDetails.authorDetails.userName": 1,
          "commentDetails.authorDetails.email": 1,
          "commentDetails.subComments._id": 1,
          "commentDetails.subComments.content": 1,
          "commentDetails.subComments.userId": 1,
          "commentDetails.subComments.subCommentAuthorDetails._id": 1,
          "commentDetails.subComments.subCommentAuthorDetails.fullName": 1,
          "commentDetails.subComments.subCommentAuthorDetails.email": 1,
          "commentDetails.subComments.subCommentAuthorDetails.userName": 1,
        },
      },
    ]);
    console.log(taskAggregation);
    if (taskAggregation) {
      return res.status(200).json({
        message: "The task found",
        status: 200,
        error: null,
        data: taskAggregation[0],
      });
    } else {
      return res.status(404).json({
        message: "Sorry, notask found",
        status: 404,
        error: null,
        data: taskAggregation,
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
});

//INTERFACE => this is the interface for getting the req.body for the listing, sorting and pagination
interface ListAllTaskRequest extends Request {
  body: {
    search?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: "asc" | "desc";
  };
}

//POST => Used to list all the task with sorting, pagination search functionality.
export const listAllTask = asyncHandler(
  async (req: ListAllTaskRequest, res: Response) => {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
        sortField = "title",
        sortOrder = "asc",
      } = req.body;

      //Initalize the redis
      const client = new Redis();

      const currentPage = Number(page) || 1;
      const pageSize = Number(limit) || 10;

      //Generate unique cache key
      const cacheKey = `tasks_${JSON.stringify(
        search
      )}_${currentPage}_${pageSize}_${sortField}_${sortOrder}`;

      //check the redis cache
      const cacheData = await client.get(cacheKey);
      if (cacheData) {
        return res.status(200).json({
          status: 200,
          message: "Task fetched from cache.",
          data: JSON.parse(cacheData),
          error: null,
        });
      }

      const searchFields = ["title", "description", "status", "priority"];

      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "projects",
            localField: "assoicatedProject",
            foreignField: "_id",
            as: "projectDetails",
          },
        },
        {
          $unwind: {
            path: "$projectDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignee",
            foreignField: "_id",
            as: "assigneeDetails",
          },
        },
        {
          $unwind: {
            path: "$assigneeDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assigner",
            foreignField: "_id",
            as: "assignerDetails",
          },
        },
        {
          $unwind: {
            path: "$assignerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "taskId",
            as: "commentDetails",
          },
        },
        {
          $unwind: {
            path: "$commentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "commentDetails.author",
            foreignField: "_id",
            as: "commentDetails.authorDetails",
          },
        },
        {
          $unwind: {
            path: "$commentDetails.authorDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "subcomments",
            localField: "commentDetails._id",
            foreignField: "commentId",
            as: "commentDetails.subComments",
          },
        },
        {
          $unwind: {
            path: "$commentDetails.subComments",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "commentDetails.subComments.userId",
            foreignField: "_id",
            as: "commentDetails.subComments.subCommentAuthorDetails",
          },
        },
        {
          $unwind: {
            path: "$commentDetails.subComments.subCommentAuthorDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            status: 1,
            priority: 1,
            startDate: 1,
            dueDate: 1,
            "projectDetails.name": 1,
            "projectDetails.description": 1,
            "assigneeDetails.fullName": 1,
            "assigneeDetails.userName": 1,
            "assigneeDetails.email": 1,
            "assignerDetails.fullName": 1,
            "assignerDetails.email": 1,
            "assignerDetails.userName": 1,
            "commentDetails._id": 1,
            "commentDetails.content": 1,
            "commentDetails.author": 1,
            "commentDetails.authorDetails._id": 1,
            "commentDetails.authorDetails.fullName": 1,
            "commentDetails.authorDetails.userName": 1,
            "commentDetails.authorDetails.email": 1,
            "commentDetails.subComments._id": 1,
            "commentDetails.subComments.content": 1,
            "commentDetails.subComments.userId": 1,
            "commentDetails.subComments.subCommentAuthorDetails._id": 1,
            "commentDetails.subComments.subCommentAuthorDetails.fullName": 1,
            "commentDetails.subComments.subCommentAuthorDetails.email": 1,
            "commentDetails.subComments.subCommentAuthorDetails.userName": 1,
          },
        },
        // Add search, sorting, and pagination
        ...buildSearchPaginationSortingPipeline(
          searchFields,
          search as string,
          sortField as string,
          sortOrder as "asc" | "desc",
          currentPage,
          pageSize
        ),
      ]; //I want to display multiple subcomment inside the single comment. I am not able to display multiple subcomment

      const taskAggregation = await Task.aggregate(pipeline);

      // Get total count for pagination
      const totalCountPipeline = pipeline.filter(
        (stage) => !("$skip" in stage || "$limit" in stage)
      );
      const totalTaskResult = await Task.aggregate([
        ...totalCountPipeline,
        { $count: "totalCount" },
      ]);
      const totalTask = totalTaskResult[0]?.totalCount || 0;

      if (taskAggregation.length === 0) {
        return res.status(200).json({
          status: 200,
          message: "No tasks found",
          data: { tasks: [], totalTask, totalPages: 0, currentPage },
          error: null,
        });
      }
      const responseData = {
        tasks: taskAggregation,
        totalTask,
        totalPages: Math.ceil(totalTask / pageSize),
        currentPage,
      };

      //Cache Data in redis
      await client.set(cacheKey, JSON.stringify(responseData), "EX", 30); //Cache expire in 30 seconds

      return res.status(200).json({
        status: 200,
        message: "Tasks fetched successfully.",
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

//POST => This function upload the multiple images for the attachment for the task.
export const uploadMultipleAttachment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;

      // Find the task by ID
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({
          status: 404,
          message: null,
          error: "Sorry, no task found",
          data: null,
        });
      }

      // Typecast request to handle files
      const customReq = req as RequestWithFiles;

      // Extract filenames from uploaded files
      const attachment: string[] =
        customReq.files?.attachment?.map((file) => file.filename) || [];

      if (attachment.length === 0) {
        return res.status(400).json({
          status: 400,
          message: "No files uploaded.",
          data: null,
          error: "No attachments found in request.",
        });
      }

      // Append new attachments to the task's attachment array
      task.attachment.push(...attachment);

      // Save the updated task
      await task.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: 200,
        message: "Attachments uploaded successfully.",
        data: {
          taskId: task._id,
          uploadedFiles: attachment,
        },
        error: null,
      });
    } catch (err) {
      console.error("Error uploading attachments:", err);
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//Used to upload multiple completed attachment
//POST => This function upload the multiple images for the completed attachment for the task.
export const uploadMultipleCompletedAttachment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;

      // Find the task by ID
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({
          status: 404,
          message: null,
          error: "Sorry, no task found",
          data: null,
        });
      }

      // Typecast request to handle files
      const customReq = req as RequestWithFiles;

      // Extract filenames from uploaded files
      const attachment: string[] =
        customReq.files?.completedTaskAttachment?.map(
          (file) => file.filename
        ) || [];

      if (attachment.length === 0) {
        return res.status(400).json({
          status: 400,
          message: "No files uploaded.",
          data: null,
          error: "No attachments found in request.",
        });
      }

      // Append new attachments to the task's attachment array
      task.attachment.push(...attachment);

      // Save the updated task
      await task.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: 200,
        message: "Attachments uploaded successfully.",
        data: {
          taskId: task._id,
          uploadedFiles: attachment,
        },
        error: null,
      });
    } catch (err) {
      console.error("Error uploading attachments:", err);
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//POST => Used to update the status of the task
export const updateStatusByAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const taskDetail = await Task.findById(taskId);
      if (!taskDetail) {
        return res.status(404).json({
          status: 404,
          message: null,
          data: null,
          error: "Sorry, no task found.",
        });
      }
      const updateStatus = await Task.findByIdAndUpdate(taskId, {
        $set: {
          approvedByTaskCreator: true,
        },
      });
      if (updateStatus) {
        return res.status(200).json({
          status: 200,
          message: "The task status has been updated by admin",
          data: null,
          error: null,
        });
      } else {
        return res.status(500).json({
          status: 500,
          message: null,
          data: null,
          error: "Sorry, the status cant be updated.",
        });
      }
    } catch (err: any) {
      console.error("Error uploading attachments:", err);
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//POST => Used to update the coomplete status of the task
export const updateCompletionStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const taskDetail = await Task.findById(taskId);
      if (!taskDetail) {
        return res.status(404).json({
          status: 404,
          message: null,
          data: null,
          error: "Sorry, no task found.",
        });
      }
      const updateStatus = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: {
            status: "completed",
          },
        },
        { new: true }
      );
      if (updateStatus) {
        return res.status(200).json({
          status: 200,
          message: "The task has been completed",
          data: null,
          error: null,
        });
      } else {
        return res.status(500).json({
          status: 500,
          message: null,
          data: null,
          error: "Sorry, the task status can not be updated..",
        });
      }
    } catch (err: any) {
      console.error("Error uploading attachments:", err);
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);
