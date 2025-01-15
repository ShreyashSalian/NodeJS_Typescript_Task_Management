import express from "express";
import {
  addNewProject,
  listAllProject,
  updateProject,
  deleteProject,
  getProjectByID,
} from "../controllers/project.controller";
import { validateApi } from "../middleware/validate";
import { projectValidation } from "../validation/project.validation";
import { verifyUser } from "../middleware/auth.middleware";

const projectRouter = express.Router();
projectRouter.post(
  "/",
  verifyUser,
  projectValidation(),
  validateApi,
  addNewProject
);

projectRouter.post("/lists", verifyUser, listAllProject);
projectRouter.put(
  "/:id",
  verifyUser,
  projectValidation(),
  validateApi,
  updateProject
);
projectRouter.delete("/:projectId", verifyUser, deleteProject);
projectRouter.get("/:projectId", verifyUser, getProjectByID);

export default projectRouter;
