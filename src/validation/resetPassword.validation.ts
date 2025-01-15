import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const resetPasswordValidation = () => {
  return checkSchema({
    token: {
      notEmpty: {
        errorMessage: "Please enter the token",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    password: {
      notEmpty: {
        errorMessage: "Please enter the password.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
  });
};
