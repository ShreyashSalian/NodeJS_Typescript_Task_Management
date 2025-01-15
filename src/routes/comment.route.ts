import express from "express";
import { verifyUser } from "../middleware/auth.middleware";
import { validateApi } from "../middleware/validate";
import { commentValidation } from "../validation/comment.validation";
import {
  addNewComment,
  listAllComments,
} from "../controllers/comment.controller";

const commentRouter = express.Router();
commentRouter.post(
  "/",
  commentValidation(),
  validateApi,
  verifyUser,
  addNewComment
);
commentRouter.post("/list-all-comments", verifyUser, listAllComments);

export default commentRouter;
