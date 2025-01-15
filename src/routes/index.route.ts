import express from "express";
import userRouter from "./user.route";
import authRouter from "./auth.route";
import taskRouter from "./task.route";
import designationRouter from "./designation.route";
import projectRouter from "./project.route";
import commentRouter from "./comment.route";
import subCommentRouter from "./subCommnt.routes";

const indexRoutes = express.Router();
indexRoutes.use("/api/v1/users", userRouter);
indexRoutes.use("/api/v1/auth", authRouter);
indexRoutes.use("/api/v1/tasks", taskRouter);
indexRoutes.use("/api/v1/designations", designationRouter);
indexRoutes.use("/api/v1/projects", projectRouter);
indexRoutes.use("/api/v1/comments", commentRouter);
indexRoutes.use("/api/v1/sub-comments", subCommentRouter);
indexRoutes.get("/api/v1", (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: "The server is running properly" });
});

export default indexRoutes;
