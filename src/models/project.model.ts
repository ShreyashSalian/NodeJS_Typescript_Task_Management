import mongoose, { Document, Schema, Types } from "mongoose";

export interface ProjectDocument extends Document {
  _id: string;
  name: string;
  description: string;
  clientName: string;
  projectNumber: string;
  createdBy: Types.ObjectId;
  isDeleted: Boolean;
  associatedTask: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    projectNumber: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    associatedTask: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model<ProjectDocument>(
  "Project",
  projectSchema
);
