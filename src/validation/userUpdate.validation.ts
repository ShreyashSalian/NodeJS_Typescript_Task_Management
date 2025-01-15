import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const updateUserDetailsValidation = () => {
  return checkSchema({
    fullName: {
      notEmpty: {
        errorMessage: "Please enter the fullName.",
      },
    },
  });
};
