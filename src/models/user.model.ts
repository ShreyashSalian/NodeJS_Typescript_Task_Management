import mongoose, { Document, Types } from "mongoose";

import bcrpyt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";

export interface UserDocument extends Document {
  _id: string;
  userName: string;
  email: string;
  fullName: string;
  profileImage?: string;
  password: string;
  role: string;
  isDeleted: Boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  designation: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  OWNER = "owner",
  EMPLOYEE = "employee",
  MODERATOR = "moderator",
}

const userSchema = new Schema<UserDocument>(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole), // Validate against the enum values
      default: UserRole.EMPLOYEE, // Set a default role
    },
    refreshToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpiry: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<UserDocument>("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  } else {
    try {
      user.password = await bcrpyt.hash(user.password, 12);
      next();
    } catch (err) {
      next(err as Error);
    }
  }
});

//Compare password methods --------------------
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  const user = this as UserDocument;
  return await bcrpyt.compare(password, user.password);
};

//generate jwt access token------------------------

userSchema.methods.generateAccessToken = function (): string {
  const user = this as UserDocument;
  const secret = process.env.ACCESS_TOKEN;
  if (!secret) {
    throw new Error(
      "ACCESS_TOKEN secret is not defined in environment variables"
    );
  }
  return jwt.sign(
    {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
    },
    secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h", // Fallback expiry of 1 hour
    }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const user = this as UserDocument;
  const secret = process.env.REFRESH_TOKEN;
  if (!secret) {
    throw new Error(
      "Refresh token secret is not defined in environment variables"
    );
  }
  return jwt.sign(
    {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
    },
    secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    }
  );
};

export const User = mongoose.model<UserDocument>("User", userSchema);
