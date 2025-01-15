import express, { Request, Response } from "express";
import { User } from "../models/user.model";
import {
  asyncHandler,
  buildSearchPaginationSortingPipeline,
  generateEmailVerificationToken,
} from "../utils/function";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { Redis } from "ioredis";
import { forgotPasswordMail, verifyEmail } from "../utils/sendMail";
import { Login } from "../models/login.model";
import fs from "fs";
import path from "path";
import { error } from "console";

// Typing for Express Request with single file upload support
interface RequestWithFile extends Request {
  file?: Express.Multer.File; // Multer's file object for a single file
}

//--------- Used for generating the refresh and accessToken --------

const generateRefreshAndAccessToken = async (userID: string) => {
  try {
    const user = await User.findById(userID);
    if (!user) throw new Error("User not found");

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    //Store the data in login model for multiple user login----------------------------
    await Login.create({
      user_id: userID,
      email: user?.email,
      token: accessToken,
      refreshToken: refreshToken,
    });
    // user.refreshToken = refreshToken;
    // await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate tokens");
  }
};

// ===== Add New User Handler =====
export const addNewUser = asyncHandler(async (req: Request, res: Response) => {
  const customReq = req as RequestWithFile;

  const { userName, email, fullName, password, role } = customReq.body;

  // Check if the user already exists
  const userExists = await User.findOne({
    $or: [{ email: email }, { userName: userName.toLowerCase() }],
  });

  if (userExists) {
    return res.status(409).json({
      status: 409,
      message: null,
      data: null,
      error: "Username or email already exists.",
    });
  }

  // Extract profile image path if provided
  const profileImage = customReq.file?.filename || "";

  //Used to send the email verification code to user to verify the user--------------
  const emailVerifyToken = await generateEmailVerificationToken();
  await verifyEmail(email, emailVerifyToken);

  // Create the new user
  const user = await User.create({
    fullName,
    email,
    userName: userName.toLowerCase(),
    password,
    role,
    profileImage,
    emailVerificationToken: emailVerifyToken,
  });

  // Retrieve created user without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken"
  );

  if (!createdUser) {
    return res.status(500).json({
      status: 500,
      message: null,
      data: null,
      error: "User creation failed.",
    });
  }

  // Return success response
  return res.status(201).json({
    status: 201,
    message: "User created successfully.",
    data: createdUser,
    error: null,
  });
});

//----- Login functionality-----------------

// Your login function
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { userName, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: userName }, { userName: userName }],
  });

  if (!user || !user.isEmailVerified) {
    return res.status(404).json({
      status: 404,
      message: null,
      data: null,
      error: "User not found with the given username or email.",
    });
  }
  if (user.isDeleted) {
    return res.status(403).json({
      status: 403,
      message: null,
      data: null,
      error: "Account is disabled. Please contact support.",
    });
  }

  const passwordCheck: boolean = await user.comparePassword(password);
  if (!passwordCheck) {
    return res.status(401).json({
      status: 401,
      message: null,
      data: null,
      error: "Please enter valid password",
    });
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user?._id
  );
  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      message: "User logged in successfully",
      data: { accessToken, refreshToken, loginUser },
      error: null,
    });
});
//-------------------------------------------------------

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // const user = await User.findOneAndUpdate(
  //   {
  //     email: req.user?.email,
  //   },
  //   {
  //     $set: {
  //       refreshToken: null,
  //     },
  //   }
  // );

  try {
    if (!req.user?.user_id) {
      const responsePayLoad = {
        status: 200,
        message: null,
        data: null,
        error: "Invalid or missing user_id in request",
      };
      res.status(200).json(responsePayLoad);
    }
    const userDetail = await Login.findOneAndDelete({
      user_id: req.user?.user_id,
    });

    if (!userDetail) {
      const responsePayLoad = {
        status: 200,
        message: null,
        data: null,
        error: "User can not logout.",
      };
      res.status(200).json(responsePayLoad);
    } else {
      const options = {
        httpOnly: true,
        secure: true,
      };

      const responsePayLoad = {
        status: 200,
        message: "User logout successfully",
        data: null,
        error: null,
      };
      res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(responsePayLoad);
    }
  } catch (error: any) {
    console.error("Error deleting user:", error);
  }
});

export const generateAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      const responsePayload = {
        status: 401,
        message: null,
        data: null,
        error: "Please enter the refresh token.",
      };
      return res.status(401).json(responsePayload);
    }
    const secretKey = process.env.ACCESS_TOKEN;
    if (!secretKey) {
      throw new Error("ACCESS_TOKEN environment variable is not set");
    }

    const verifyRefreshToken = jwt.verify(
      incomingRefreshToken,
      secretKey
    ) as JwtPayload;

    if (!verifyRefreshToken) {
      const responsePayload = {
        status: 401,
        message: null,
        data: null,
        error: "Unauthorized user.",
      };
      return res.status(401).json(responsePayload);
    }
    const user = await User.findById(verifyRefreshToken?._id);
    if (!user) {
      const responsePayload = {
        status: 401,
        message: null,
        data: null,
        error: "Please enter the valid refresh token",
      };
      return res.status(401).json(responsePayload);
    }
    if (incomingRefreshToken !== user.refreshToken) {
      const responsePayload = {
        status: 401,
        message: null,
        data: null,
        error: "Refresh token is expired.",
      };
      return res.status(401).json(responsePayload);
    }
    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
      user?._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    const responsePayLoad = {
      status: 200,
      message: "Refresh token generated successfully.",
      data: { accessToken, refreshToken },
      error: null,
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(responsePayLoad);
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.user_id);
    if (!user) {
      const responsePayload = {
        status: 404,
        message: null,
        data: null,
        error: "User not found.",
      };
      return res.status(404).json(responsePayload);
    }
    const passwordCheck = await user.comparePassword(oldPassword);
    if (!passwordCheck) {
      const responsePayload = {
        status: 401,
        message: null,
        data: null,
        error: "Please enter the valid password.",
      };
      return res.status(401).json(responsePayload);
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    const responsePayload = {
      status: 200,
      message: "Password has been updated successfully.",
      data: null,
      error: null,
    };
    return res.status(200).json(responsePayload);
  }
);

//------------- Forgot password functionality --------------------
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      const responsePayload = {
        status: 404,
        message: null,
        data: null,
        error: "No user found with the given email",
      };
      return res.status(404).json(responsePayload);
    }
    const token = crypto.randomBytes(32).toString("hex");
    const date = Date.now() + 3600000;
    await User.findByIdAndUpdate(user?._id, {
      $set: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: date,
      },
    });
    await forgotPasswordMail(token, user?.email);
    const responsePayload = {
      status: 200,
      message: "Reset password mail has been send successfully.",
      data: null,
      error: null,
    };
    return res.status(404).json(responsePayload);
  }
);

//-------------- reset Password functionality------------------------
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      const responsePayload = {
        status: 400,
        message: null,
        data: null,
        error: "The token has been expired or please enter the valid token",
      };
      return res.status(400).json(responsePayload);
    }
    user.password = password;
    user.resetPasswordToken = "";
    user.resetPasswordTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    const responsePayload = {
      status: 200,
      message: "The user has reset the password successfully.",
      data: null,
      error: null,
    };
    return res.status(200).json(responsePayload);
  }
);

// export const listAllUser = asyncHandler(async (req: Request, res: Response) => {
//   try {
//     const { search = "", page = 1, limit = 10 } = req.body;
//     // Redis client
//     const client = new Redis();
//     client.on("error", (err) => {
//       console.error("Redis connection error:", err);
//     });

//     const currentPage = parseInt(page as string, 10) || 1;
//     const pageSize = parseInt(limit as string, 10) || 10;

//     // Generate a unique cache key based on query parameters
//     const cacheKey = `users_${search}_${currentPage}_${pageSize}`;

//     // Check if data is available in Redis cache
//     const cacheValue = await client.get(cacheKey);
//     if (cacheValue) {
//       return res.status(200).json({
//         status: 200,
//         message: "Users list fetched from cache.",
//         data: JSON.parse(cacheValue),
//         error: null,
//       });
//     }

//     // Build search query
//     const searchQuery = search
//       ? {
//           role: "employee",
//           $or: [
//             { userName: { $regex: search, $options: "i" } }, // Case-insensitive search
//             { email: { $regex: search, $options: "i" } },
//             { fullName: { $regex: search, $options: "i" } },
//           ],
//         }
//       : { role: "employee" };

//     // Fetch users from database with pagination
//     const totalUsers = await User.countDocuments(searchQuery).select(
//       "-password -refreshToken"
//     );
//     const userList = await User.find(searchQuery)

//       .skip((currentPage - 1) * pageSize)
//       .limit(pageSize);

//     if (userList.length === 0) {
//       return res.status(200).json({
//         status: 200,
//         message: "No users available.",
//         data: { users: [], totalUsers, totalPages: 0 },
//         error: null,
//       });
//     }

//     // Cache the data
//     const responseData = {
//       users: userList,
//       totalUsers,
//       totalPages: Math.ceil(totalUsers / pageSize),
//       currentPage,
//     };

//     await client.set(cacheKey, JSON.stringify(responseData));
//     await client.expire(cacheKey, 30); // Cache expiration in seconds

//     return res.status(200).json({
//       status: 200,
//       message: "Users list fetched from database.",
//       data: responseData,
//       error: null,
//     });
//   } catch (error: any) {
//     console.error("Error fetching users:", error);
//     return res.status(500).json({
//       status: 500,
//       message: "Error fetching users.",
//       data: null,
//       error: error.message,
//     });
//   }
// });
export const listAllUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      sortField = "userName",
      sortOrder,
    } = req.body;

    // Initialize Redis client
    const client = new Redis();
    client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    const currentPage = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    // const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Generate unique cache key
    const cacheKey = `users_${JSON.stringify(
      search
    )}_${currentPage}_${pageSize}_${sortField}_${sortOrder}`;

    // Check Redis cache
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        status: 200,
        message: "Users fetched from cache.",
        data: JSON.parse(cachedData),
        error: null,
      });
    }

    // Build search query
    // const searchQuery: any = { role: "employee" }; // Default filter by role
    // if (search) {
    //   // Dynamically add search fields
    //   for (const [key, value] of Object.entries(search)) {
    //     searchQuery[key] = { $regex: value, $options: "i" }; // Case-insensitive search
    //   }
    // }

    // Fetch total users for pagination
    // const totalUsers = await User.countDocuments(searchQuery);

    //New code-------------------------------------------------
    const searchFields = [
      "userName",
      "email",
      "fullName",
      "designationDetails.department",
      "designationDetails.designation",
      "designationDetails.contact_address",
    ];
    const pipeline = [
      {
        $match: {
          role: "employee",
        },
      },
      {
        $lookup: {
          from: "designations", // Collection name for Designation
          localField: "_id", // Field in User collection
          foreignField: "user", // Field in Designation collection
          as: "designationDetails", // Output array field
        },
      },
      { $unwind: "$designationDetails" }, // Flatten the designationDetails array
      {
        $project: {
          password: 0,
          refreshToken: 0,
          emailVerificationToken: 0,
          resetPasswordToken: 0, // Exclude sensitive fields
        },
      },
      ...buildSearchPaginationSortingPipeline(
        searchFields,
        search as string,
        sortField as string,
        sortOrder,
        currentPage,
        pageSize
      ),
    ];
    // console.log(pipeline);
    const userAggregation = await User.aggregate(pipeline);
    //Get total count for pagination
    const totalCountPipeline = pipeline.filter(
      (stage) => !("$skip" in stage || "$limit" in stage)
    );
    const totalCount = await User.aggregate([
      ...totalCountPipeline,
      { $count: "totalCount" },
    ]);

    const totalUsers = totalCount.length > 0 ? totalCount[0].totalCount : 0;
    if (userAggregation.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "No users available.",
        data: { users: [], totalUsers, totalPages: 0, currentPage },
        error: null,
      });
    }

    // Prepare response data
    const responseData = {
      users: userAggregation,
      totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage,
    };

    // Cache data in Redis
    await client.set(cacheKey, JSON.stringify(responseData), "EX", 30); // Cache expiration in 30 seconds

    // Return response
    return res.status(200).json({
      status: 200,
      message: "Users fetched from database.",
      data: responseData,
      error: null,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      status: 500,
      message: "Error fetching users.",
      data: null,
      error: error.message,
    });
  }

  //----------------------------------------------------------

  // Old Code-------------------------------------------------

  // Fetch users with sorting and pagination
  // const userAggregation = await User.find(searchQuery)
  //   .sort({ [sortField]: sortDirection }) // Dynamic sorting
  //   .skip((currentPage - 1) * pageSize)
  //   .limit(pageSize)
  //   .select(
  //     "-password -refreshToken -emailVerificationToken -resetPasswordToken"
  //   ); // Exclude sensitive fields
  // const userAggregation = await User.aggregate([
  //   { $match: searchQuery }, // Apply search filters
  //   {
  //     $lookup: {
  //       from: "designations", // Collection name for Designation
  //       localField: "_id", // Field in User collection
  //       foreignField: "user", // Field in Designation collection
  //       as: "designationDetails", // Output array field
  //     },
  //   },
  //   { $unwind: "$designationDetails" }, // Flatten the designationDetails array
  //   {
  //     $project: {
  //       password: 0,
  //       refreshToken: 0,
  //       emailVerificationToken: 0,
  //       resetPasswordToken: 0, // Exclude sensitive fields
  //     },
  //   },
  //   { $sort: { [sortField]: sortDirection } }, // Apply sorting
  //   { $skip: (currentPage - 1) * pageSize }, // Pagination skip
  //   { $limit: pageSize }, // Pagination limit
  // ]);

  // console.log(userAggregation);

  //   if (userAggregation.length === 0) {
  //     return res.status(200).json({
  //       status: 200,
  //       message: "No users available.",
  //       data: { users: [], totalUsers, totalPages: 0, currentPage },
  //       error: null,
  //     });
  //   }

  //   // Prepare response data
  //   const responseData = {
  //     users: userAggregation,
  //     totalUsers,
  //     totalPages: Math.ceil(totalUsers / pageSize),
  //     currentPage,
  //   };

  //   // Cache data in Redis
  //   await client.set(cacheKey, JSON.stringify(responseData), "EX", 30); // Cache expiration in 30 seconds

  //   // Return response
  //   return res.status(200).json({
  //     status: 200,
  //     message: "Users fetched from database.",
  //     data: responseData,
  //     error: null,
  //   });
  // } catch (error: any) {
  //   console.error("Error fetching users:", error);
  //   return res.status(500).json({
  //     status: 500,
  //     message: "Error fetching users.",
  //     data: null,
  //     error: error.message,
  //   });
  // }
});

//--------------Used to get all the employeee ------------------------------

export const getAllEmployee = asyncHandler(
  async (req: Request, res: Response) => {
    const employeeDetails = await User.find({ role: "user" });
  }
);

//------- Used to verify the email of the user ------------------------------------
export const userEmailVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.body;
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(200).json({
        status: 400,
        message: null,
        data: null,
        error: "Sorry, the given token is expired or invalid.",
      });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: 200,
      message: "Email verified successfully.",
      data: null,
      error: null,
    });
  }
);

//get userDetails with designation--------------

export const getUserDetailWithDesignation = asyncHandler(
  async (req: Request, res: Response) => {
    const userWithDesignation = await User.aggregate([
      {
        $lookup: {
          from: "designations",
          localField: "_id",
          foreignField: "user",
          as: "designationDetails",
        },
      },
      {
        //Optionally unwind the designationDetails array if you expect one to one realtionship
        $unwind: {
          path: "$designationDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          fullName: 1,
          userName: 1,
          role: 1,
          "designationDetails.joining_date": 1,
          "designationDetails.contact_address": 1,
          "designationDetails.contact_number": 1,
          "designationDetails.department": 1,
          "designationDetails.designation": 1,
        },
      },
    ]);
    if (!userWithDesignation.length) {
      return res.status(404).json({
        status: 404,
        message: "No users found.",
        data: null,
        error: null,
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User details with designation.",
      data: userWithDesignation,
      error: null,
    });
  }
);

//Used to update the details
export const updateUserDetail = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { fullName } = req.body;
      const updateDetail = await User.findByIdAndUpdate(
        req.user?.user_id,
        {
          $set: {
            fullName: fullName,
          },
        },
        {
          new: true,
        }
      ).select(
        "-password -refreshToken -emailVerificationToken -resetPasswordTokenExpiry"
      );
      if (updateDetail) {
        return res.status(200).json({
          status: 200,
          message: "User detail updated successfully.",
          error: null,
          data: updateDetail,
        });
      } else {
        return res.status(200).json({
          status: 200,
          message: null,
          error: "Sorry, the user details can not be updated.",
          data: null,
        });
      }
    } catch (err: any) {
      res.status(500).json({
        status: 500,
        error: "Internal server error",
        message: null,
        data: null,
      });
    }
  }
);

//Used to update the profile image

export const updateUserProfileImage = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const customReq = req as RequestWithFile;

      //Fetch the user details
      const user = await User.findById(req.user?.user_id);
      if (!user) {
        return res.status(400).json({
          status: 400,
          error: "User ID not found in request",
          message: null,
          data: null,
        });
      }
      //Handle profile image update
      if (customReq.file) {
        //Remove old profileImage if it exists
        if (user?.profileImage) {
          const oldImagePath = path.resolve(
            __dirname,
            "../../public/attachment",
            user?.profileImage
          );

          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.log("Error deleting old profile image");
            }
          });
        }
        //Update profileImage field with new image
        user.profileImage = customReq.file.filename;
        await user.save({ validateBeforeSave: false });
        res.status(200).json({
          status: 200,
          message: "User details updated successfully",
          data: null,
          error: null,
        });
      }
    } catch (err: any) {
      res.status(500).json({
        status: 500,
        error: "Internal server error",
        message: null,
        data: null,
      });
    }
  }
);

//Delete the profile Image

export const deleteProfileImage = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Fetch the user details
      const user = await User.findById(req.user?.user_id);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "User not found.",
          data: null,
          error: null,
        });
      }

      if (user.profileImage) {
        // Resolve the old image path
        const oldImagePath = path.resolve(
          __dirname,
          "../../public/attachment",
          user.profileImage
        );

        // Delete the old profile image
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Error deleting old profile image:", err);
            return res.status(500).json({
              status: 500,
              message: "Failed to delete old profile image.",
              data: null,
              error: err.message,
            });
          }
        });
      }

      // Update profile image field in the database
      user.profileImage = "";
      await user.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: 200,
        message: "Profile image deleted successfully.",
        data: null,
        error: null,
      });
    } catch (error: any) {
      console.error("Error deleting profile image:", error);
      return res.status(500).json({
        status: 500,
        message: "An error occurred while deleting the profile image.",
        data: null,
        error: error.message,
      });
    }
  }
);

//Delete the user => only access by admin
export const deleteParticularUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const updateUser = await User.findByIdAndUpdate(userId, {
        $set: {
          isDeleted: true,
        },
      });
      if (updateUser) {
        return res.status(200).json({
          status: 200,
          error: null,
          message: "User deleted successfully.",
          data: null,
        });
      } else {
        return res.status(500).json({
          status: 500,
          error: "Sorry, the user can not be deleted.",
          message: null,
          data: null,
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
