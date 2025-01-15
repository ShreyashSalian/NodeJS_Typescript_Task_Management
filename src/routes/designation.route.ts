import express from "express";
import { designationValidator } from "../validation/designation.validation";
import { validateApi } from "../middleware/validate";
import { verifyUser } from "../middleware/auth.middleware";
import {
  addDesignation,
  updateDesignation,
} from "../controllers/designation.controller";

const designationRouter = express.Router();

designationRouter.post(
  "/",
  verifyUser,
  designationValidator(),
  validateApi,
  addDesignation
);

designationRouter.put(
  "/:id",
  verifyUser,
  designationValidator(),
  validateApi,
  updateDesignation
);

export default designationRouter;
