import mongoose, { Document, Schema, Types } from "mongoose";
import { SubComment } from "./subComment.model";

export interface CommentDocument extends Document {
  _id: string;
  taskId: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  subCommentsIds: Types.ObjectId[];
  createdAt: Date;
  isDeleted: Boolean;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    subCommentsIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubComment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to delete subcomments before removing a comment
commentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      // Find the subcomments linked to the comment and delete them
      await SubComment.deleteMany({ commentId: this._id });

      next();
    } catch (err) {
      next(err as Error);
    }
  }
);
export const Comment = mongoose.model<CommentDocument>(
  "Comment",
  commentSchema
);
