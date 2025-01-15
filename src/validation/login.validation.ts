import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const loginValidation = () => {
  return checkSchema({
    userName: {
      notEmpty: {
        errorMessage: "PLease enter the valid Email or UserName.",
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
