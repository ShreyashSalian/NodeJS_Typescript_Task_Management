import mongoose, { Document, Schema, Types } from "mongoose";

export interface DesignationDocument extends Document {
  _id: string;
  user: Types.ObjectId;
  joining_date: Date;
  dob: Date;
  contact_number: string;
  contact_address: string;
  designation: string;
  department: string;
  total_Leaves: number;
  remaining_leaves: number;
  additional_leaves: number;
  createdAt: Date;
  updatedAt: Date;
}
export enum Department {
  IT = "it",
  MARKETING = "marketing",
  SALES = "sales",
  BDE = "bde",
  ACCOUNT = "account",
  MANAGER = "manager",
}

export enum DesignationEnum {
  SENIOR = "senior",
  JUNIOR = "junior",
  FRESHER = "fresher",
  EXPERIENCED = "experienced",
}

const designationSchema = new Schema<DesignationDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joining_date: {
      type: Date,
      required: true,
      validate: {
        validator: (v: Date) => v <= new Date(),
        message: "Joining date cannot be in the future.",
      },
    },
    dob: {
      type: Date,
      validate: {
        validator: (v: Date) => v <= new Date(),
        message: "Birth date cannot be in the future.",
      },
    },
    contact_address: {
      type: String,
    },
    contact_number: {
      type: String,
    },
    department: {
      type: String,
      required: true,
      enum: Object.values(Department), // Validate against the enum values
      default: Department.IT,
    },
    designation: {
      type: String,
      required: true,
      enum: Object.values(DesignationEnum),
      default: DesignationEnum.FRESHER,
    },
    total_Leaves: {
      type: Number,
      default: 12,
    },
    remaining_leaves: {
      type: Number,
      default: 12,
    },
    additional_leaves: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Designation = mongoose.model<DesignationDocument>(
  "Designation",
  designationSchema
);
