import { Request, Response } from "express";
import { Designation } from "../models/designation.model";
import { asyncHandler } from "../utils/function";
import { User } from "../models/user.model";

export const addDesignation = asyncHandler(
  async (req: Request, res: Response) => {
    const currentLoginUser = req.user;
    const {
      user,
      joining_date,
      dob,
      contact_address,
      contact_number,
      department,
      designation,
    } = req.body;

    // Log request body for debugging
    console.log(req.body);

    let userDetails;

    // Handle user identification
    if (!user) {
      userDetails = await User.findOne({
        userName: currentLoginUser?.userName,
      }).select("-refreshToken -resetPasswordToken");
    } else {
      userDetails = await User.findById(user).select(
        "-refreshToken -resetPasswordToken"
      );
    }

    // Check if user exists
    if (!userDetails) {
      return res.status(400).json({
        status: 400,
        message: "Invalid user ID or current user not found",
        data: null,
        error: "User does not exist",
      });
    }

    // Create designation
    const designationDetails = await Designation.create({
      user: userDetails._id,
      joining_date,
      dob,
      contact_address,
      contact_number,
      department,
      designation,
    });

    if (designationDetails) {
      // Fetch details with user info
      const designationWithUserDetails = await Designation.aggregate([
        {
          $match: {
            _id: designationDetails._id,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "UserDetails",
          },
        },
        {
          $unwind: "$UserDetails",
        },
        {
          $project: {
            "UserDetails.password": 0, // Exclude sensitive fields
            "UserDetails.refreshToken": 0,
            "UserDetails.resetPasswordToken": 0,
            "UserDetails.resetPasswordTokenExpiry": 0,
          },
        },
      ]);

      // Return success response
      return res.status(201).json({
        status: 201,
        message: "User designation has been successfully created",
        data: designationWithUserDetails[0],
        error: null,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: null,
        data: null,
        error: "Sorry, the designation could not be created.",
      });
    }
  }
);

export const updateDesignation = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      joining_date,
      dob,
      contact_address,
      contact_number,
      department,
      designation,
    } = req.body;

    const updateDesignation = await Designation.findByIdAndUpdate(
      id,
      {
        joining_date,
        dob,
        contact_address,
        contact_number,
        department,
        designation,
      },
      {
        new: true,
      }
    );
    if (updateDesignation) {
      const updateDesignationDetails = await Designation.aggregate([
        {
          $match: {
            _id: updateDesignation?._id,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "UserDetails",
          },
        },
        {
          $unwind: "$UserDetails",
        },
        {
          $project: {
            "userDetails.password": 0, // Exclude sensitive fields
            "userDetails.refreshToken": 0,
            "userDetails.resetPasswordToken": 0,
            "userDetails.resetPasswordTokenExpiry": 0,
          },
        },
      ]);
      return res.status(201).json({
        status: 201,
        message: "User Designation has been updated",
        data: updateDesignationDetails[0],
        error: null,
      });
    } else {
      return res.status(201).json({
        status: 500,
        message: null,
        data: null,
        error: "Sorry, the designation can not updated.",
      });
    }
  }
);
