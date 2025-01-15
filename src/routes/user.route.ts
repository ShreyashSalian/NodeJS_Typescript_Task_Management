import express from "express";
import userRegistrationValidator from "../validation/user.validation";
import { upload } from "../middleware/multer.middleware";
import {
  addNewUser,
  forgotPassword,
  listAllUser,
  resetPassword,
  getUserDetailWithDesignation,
  userEmailVerification,
  updateUserDetail,
  updateUserProfileImage,
  deleteProfileImage,
  deleteParticularUser,
} from "../controllers/user.controller";
import { validateApi } from "../middleware/validate";
import { forgotPasswordValidation } from "../validation/forgotPassword.validation";
import { resetPasswordValidation } from "../validation/resetPassword.validation";
import { verify } from "crypto";
import { verifyUser, AdminUser } from "../middleware/auth.middleware";
import { updateUserDetailsValidation } from "../validation/userUpdate.validation";
import { updateProfileImageValidation } from "../validation/updateProfileImageValidation";

const userRouter = express.Router();

userRouter.post(
  "/",
  upload.single("profileImage"),
  userRegistrationValidator(),
  validateApi,
  verifyUser,
  addNewUser
);

userRouter.post(
  "/forgot-password",
  forgotPasswordValidation(),
  validateApi,
  forgotPassword
);
userRouter.post(
  "/reset-password",
  resetPasswordValidation(),
  validateApi,
  resetPassword
);
userRouter.post("/userlist", verifyUser, listAllUser);
userRouter.get(
  "/user-with-designation",
  verifyUser,
  getUserDetailWithDesignation
);

userRouter.post("/email-verification", userEmailVerification);
userRouter.put(
  "/update-profile",
  verifyUser,
  updateUserDetailsValidation(),
  validateApi,
  updateUserDetail
);
userRouter.post(
  "/update-profile-image",
  upload.single("profileImage"),
  updateProfileImageValidation(),
  validateApi,
  verifyUser,
  updateUserProfileImage
);
userRouter.post("/delete-profile-image", verifyUser, deleteProfileImage);
userRouter.post("/delete-user", verifyUser, AdminUser, deleteParticularUser);

export default userRouter;
