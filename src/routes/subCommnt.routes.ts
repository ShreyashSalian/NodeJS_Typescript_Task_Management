import express from "express";
import { verifyUser } from "../middleware/auth.middleware";
import {
  addNewSubComment,
  deleteSubComment,
  getSubCommentByID,
  softDeletedComment,
} from "../controllers/subComment.controller";
import { validateApi } from "../middleware/validate";
import { subCommentValidation } from "../validation/subComment.validation";

const subCommentRouter = express.Router();

// Used to create new sub comment-----
subCommentRouter.post(
  "/",
  verifyUser,
  subCommentValidation(),
  validateApi,
  addNewSubComment
);

//Used to get the details of the given sub comment
subCommentRouter.get("/:subCommentId", verifyUser, getSubCommentByID);

//Used to soft delete the subcomment//The subcomment will be there in database
subCommentRouter.post(
  "/soft-delete/:subCommentId",
  verifyUser,
  softDeletedComment
);
//Used to delete the subcomment
subCommentRouter.delete("/:subCommentId", verifyUser, deleteSubComment);
export default subCommentRouter;
