import express from "express";
import { changePassword, login, logout } from "../controllers/user.controller";
import { verifyUser } from "../middleware/auth.middleware";
import { loginValidation } from "../validation/login.validation";
import { validateApi } from "../middleware/validate";
import { changePasswordValidation } from "../validation/changePassword.validation";

const authRouter = express.Router();
authRouter.post("/login", loginValidation(), validateApi, login);
authRouter.get("/logout", verifyUser, logout);
authRouter.post(
  "/change-password",
  changePasswordValidation(),
  validateApi,
  verifyUser,
  changePassword
);

export default authRouter;
