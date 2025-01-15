import mongoose, { Document, Schema, Types } from "mongoose";

export interface leaveManagement extends Document {
  _id: string;
  employeeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: string;
  leave_type: string;
  createAt: Date;
  updatedAt: Date;
}

export enum Status {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum LeaveType {
  SICK = "sick",
  CASUAL = "casual",
  ANNUAL = "annual",
}

const leaveManagementSchema = new Schema<leaveManagement>(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    leave_type: {
      type: String,
      required: true,
      enum: Object.values(LeaveType),
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(Status.PENDING),
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveRequest = mongoose.model<leaveManagement>(
  "LeaveRequest",
  leaveManagementSchema
);
