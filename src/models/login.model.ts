import mongoose, { Document, Schema, Types } from "mongoose";

export interface LoginDocument extends Document {
  _id: string;
  user_id: Types.ObjectId;
  email: string;
  token: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const loginSchema = new Schema<LoginDocument>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Login = mongoose.model<LoginDocument>("login", loginSchema);
