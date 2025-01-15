import express from "express";
import { verifyUser } from "../middleware/auth.middleware";
import { validateApi } from "../middleware/validate";
import { leaveRequestValidation } from "../validation/leaveRequest.validation";
import { addLeaveRequest } from "../controllers/leaveRequest.controller";

const leaveRequestRoutes = express.Router();
leaveRequestRoutes.post(
  "/",
  leaveRequestValidation(),
  validateApi,
  verifyUser,
  addLeaveRequest
);

export default leaveRequestRoutes;
