import { Designation } from "../models/designation.model";
import { User } from "../models/user.model";
import { adminUserList } from "./adminUser";
import { asyncHandler } from "./function";
import express, { Request, Response } from "express";

export const addUserAdmin = async (): Promise<void> => {
  try {
    for (const user of adminUserList) {
      const userExist = await User.findOne({
        $or: [
          {
            email: user.email,
          },
          {
            userName: user.userName,
          },
        ],
      });
      if (!userExist) {
        const createdUser = await User.create({
          email: user.email,
          fullName: user.fullName,
          password: user.password,
          userName: user.userName,
          role: "admin",
          isEmailVerified: true,
        });
        console.log(`Admin user ${user.fullName} added successfully.`);
        console.log(createdUser._id);
        await Designation.create({
          user: createdUser?._id,
          joining_date: "2022-01-01",
          contact_address: "surat",
          contact_number: "9876543211",
          department: "manager",
          designation: "senior",
        });
      }
    }
  } catch (err) {
    console.error("Error adding admin users:", err);
  }
};
