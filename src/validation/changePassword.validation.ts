import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const changePasswordValidation = () => {
  return checkSchema({
    oldPassword: {
      notEmpty: {
        errorMessage: "Please enter the old password.",
      },
      matches: {
        options: [/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/],
        errorMessage:
          "Old Password must be at least 6 characters long, including a number and a special character.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    NewPassword: {
      notEmpty: {
        errorMessage: "Please enter the new password.",
      },
      matches: {
        options: [/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/],
        errorMessage:
          "New Password must be at least 6 characters long, including a number and a special character.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
  });
};
