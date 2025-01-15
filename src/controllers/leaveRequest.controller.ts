import { Request, Response } from "express";
import { asyncHandler } from "../utils/function";
import { LeaveRequest } from "../models/leaveManagement.model";
import { User } from "../models/user.model";
import { Designation } from "../models/designation.model";

//POST => Used to add the leave request

export const addLeaveRequest = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      console.log(user);
      const { startDate, endDate, reason, leave_type } = req.body;

      //Calculate the numbers of leave
      const leaveDays =
        Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      //Check if employee has enough remaining leaves
      const employee = await User.findById(user);
      if (!employee) {
        return res.status(404).json({
          status: 404,
          data: null,
          message: null,
          error: "No employee found",
        });
      }
      const employeeDesignation = await Designation.findOne({ user: user });
      if (!employeeDesignation) {
        return res.status(404).json({
          status: 404,
          data: null,
          message: null,
          error: "No designation found",
        });
      }
      if (employeeDesignation.remaining_leaves < leaveDays) {
        return res.status(400).json({
          status: 400,
          data: null,
          message: null,
          error: "Sorry, you dont have sufficient leave",
        });
      }
      // employeeDesignation.remaining_leaves -= leaveDays;
      // employeeDesignation.save({ validateBeforeSave: false });
      const leaveRequestCreation = await LeaveRequest.create({
        startDate,
        endDate,
        reason,
        leave_type,
      });
      if (leaveRequestCreation) {
        return res.status(200).json({
          status: 200,
          data: null,
          message: "The leave request has been submitted successfully.",
          error: null,
        });
      }
    } catch (err: any) {
      console.error("Error", err);
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);

//POST => This function is used by the admin to accept the leave request
export const updateLeaveStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { leaveId, status } = req.body;

      // Find the leave request
      const leaveRequest = await LeaveRequest.findById(leaveId);
      if (!leaveRequest) {
        return res.status(404).json({
          status: 404,
          data: null,
          message: null,
          error: "Sorry, no leave request found.",
        });
      }

      // Update the leave request status
      leaveRequest.status = status;
      await leaveRequest.save();

      // Deduct leave days from remaining leaves if status is approved
      if (status === "approved") {
        const leaveDays =
          Math.ceil(
            (new Date(leaveRequest.endDate).getTime() -
              new Date(leaveRequest.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        // Find the employee's designation record
        const employee = await Designation.findOne({
          user: leaveRequest.employeeId,
        });
        if (!employee) {
          return res.status(404).json({
            status: 404,
            data: null,
            message: null,
            error: "Sorry, no employee found",
          });
        }

        // Check if there are enough remaining leaves
        if (employee.remaining_leaves < leaveDays) {
          return res.status(400).json({
            status: 400,
            data: null,
            message: null,
            error: "Insufficient remaining leaves to approve this request.",
          });
        }

        // Deduct leave days and save
        employee.remaining_leaves -= leaveDays;
        await employee.save({ validateBeforeSave: false });
      }

      // Respond with success
      return res.status(200).json({
        status: 200,
        data: leaveRequest,
        message: "Leave request updated successfully.",
        error: null,
      });
    } catch (err: any) {
      console.error("Error:", err);
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);
