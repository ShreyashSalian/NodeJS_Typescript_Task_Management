import mongoose, { Document, Types, Schema } from "mongoose";

export interface SubCommentDocument extends Document {
  _id: String;
  commentId: Types.ObjectId;
  userId: Types.ObjectId;
  isDeleted: boolean;
  content: String;
  createdAt: Date;
  updatedAt: Date;
}

const subCommentSchema = new Schema<SubCommentDocument>(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const SubComment = mongoose.model<SubCommentDocument>(
  "SubComment",
  subCommentSchema
);
