import express from "express";
import { taskValidation } from "../validation/task.validation";
import { validateApi } from "../middleware/validate";
import { upload } from "../middleware/multer.middleware";
import {
  addNewTask,
  deleteMultiplCompletedTaskAttachmentImages,
  deleteMultipleImages,
  deleteTask,
  getTaskByID,
  listAllTask,
  updateCompletionStatus,
  updateStatusByAdmin,
  uploadMultipleAttachment,
  uploadMultipleCompletedAttachment,
} from "../controllers/task.controller";
import { verifyUser, AdminUser } from "../middleware/auth.middleware";

const taskRouter = express.Router();

taskRouter.post(
  "/",
  upload.fields([
    { name: "attachment", maxCount: 10 }, // Specify max file count if needed
    { name: "completedTaskAttachment", maxCount: 10 },
  ]),
  taskValidation(),
  validateApi,
  addNewTask
);
taskRouter.post("/list-all-task", verifyUser, listAllTask);

//delete the attachment
taskRouter.post(
  "/delete-attachments/:taskId",
  verifyUser,
  deleteMultipleImages
);
taskRouter.post(
  "/delete-completed-task-attachment/:taskId",
  verifyUser,
  deleteMultiplCompletedTaskAttachmentImages
);
taskRouter.post(
  "/upload-mutiple-attachment/:taskId",
  upload.array("attachment", 10),
  verifyUser,
  uploadMultipleAttachment
);
taskRouter.post(
  "/upload-multiple-completed-task-images",
  upload.array("completedTaskAttachment", 10),
  verifyUser,
  uploadMultipleCompletedAttachment
);
taskRouter.get("/:taskId", verifyUser, getTaskByID);
taskRouter.delete("/:taskId", verifyUser, deleteTask);
taskRouter.get(
  "/update-status-by-admin/:taskId",
  verifyUser,
  AdminUser,
  updateStatusByAdmin
);
taskRouter.get("/update-status/:taskId", verifyUser, updateCompletionStatus);
export default taskRouter;
