import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/function";
import dotenv from "dotenv";
import { Login } from "../models/login.model";
dotenv.config();

interface userdetails {
  // _id: string;
  // userName: string;
  // email: string;
  // fullName: string;
  user_id: string;
  email: string;
  token: string;
}

// Extend Express Request interface to include `user`
interface AuthenticatedRequest extends Request {
  user?: userdetails;
}
// verifyUser middleware
// Verify user middleware
export const verifyUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer", "");

      if (!token) {
        return res.status(401).json({
          status: 401,
          message: null,
          data: null,
          error: "Unauthorized request. No token provided.",
        });
      }

      const secretKey = process.env.ACCESS_TOKEN;
      if (!secretKey) {
        throw new Error("ACCESS_TOKEN environment variable is not set");
      }

      const decodedToken = jwt.verify(token, secretKey) as JwtPayload;
      // const userId = await User.findById(decodedToken?._id);

      const userId = await Login.findOne({
        $and: [
          {
            token: token,
          },
          {
            email: decodedToken?.email,
          },
          {
            user_id: decodedToken?._id,
          },
        ],
      });

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: null,
          data: null,
          error: "Unauthorized request. Invalid token.",
        });
      }

      // Use lean() to get a plain JavaScript object instead of a Mongoose document
      // const user = await User.findById(userId)
      //   .select("-password -refreshToken")
      //   .lean();
      // if (!user) {
      //   return res.status(401).json({
      //     status: 401,
      //     message: null,
      //     data: null,
      //     error: "Unauthorized request. User not found.",
      //   });
      // }

      req.user = userId; // Assign the user object to req.user

      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          status: 401,
          message: null,
          data: null,
          error: "Unauthorized request. Token expired.",
        });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          status: 401,
          message: null,
          data: null,
          error: "Unauthorized request. Invalid token.",
        });
      }

      console.error("Error:", err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error.",
        data: null,
        error: "An error occurred during token verification.",
      });
    }
  }
);

export const AdminUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure req.user is defined
      if (!req.user?.user_id) {
        return res.status(401).json({
          status: 401,
          message: "Unauthorized request. User information is missing.",
          data: null,
          error: null,
        });
      }

      // Fetch user details
      const user = await User.findById(req.user?.user_id);
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "User not found.",
          data: null,
          error: null,
        });
      }
      if (user?.role === "admin") {
        next();
      } else {
        return res.status(401).json({
          status: 401,
          message: null,
          data: null,
          error: "Unauthorized request. Sorry you are not allowed to this.",
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
  }
);
