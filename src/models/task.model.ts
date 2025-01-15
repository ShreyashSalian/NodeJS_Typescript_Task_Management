import mongoose, { Document, Schema, Types } from "mongoose";
import { Comment } from "./comment.model";

export interface TaskDocument extends Document {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: Types.ObjectId;
  assigner: Types.ObjectId;
  assoicatedProject: Types.ObjectId;
  startDate: Date;
  dueDate: Date;
  isDeleted: Boolean;
  attachment: string[];
  approvedByTaskCreator: Boolean;
  completedTaskAttachment: string[];
  commentsIds: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export enum Status {
  PENDING = "pending",
  INPROGRESS = "in-progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  MISSED = "missed",
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRICTICAL = "crictical",
}

const taskSchema = new Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(Status), // Validate against the enum values
      default: Status.PENDING, // Set a default role
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(Priority), // Validate against the enum values
      default: Priority.LOW, // Set a default role
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assoicatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    approvedByTaskCreator: {
      type: Boolean,
      default: false,
    },
    attachment: [
      {
        type: String,
      },
    ],
    completedTaskAttachment: [
      {
        type: String,
      },
    ],
    commentsIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Middleware to delete the comments and subcomments
taskSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const task = this as any; // 'this' refers to the document being deleted
      const taskId = task._id;
      await Comment.deleteMany({ taskId: taskId });
      // Delete all comments associated with this task
      await Task.updateOne(
        { _id: taskId },
        { $pull: { commentsIds: { $in: task.commentsIds } } }
      );
      next();
    } catch (err) {
      next(err as Error);
    }
  }
);
export const Task = mongoose.model<TaskDocument>("Task", taskSchema);
