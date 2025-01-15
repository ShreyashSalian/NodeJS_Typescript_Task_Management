import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const projectValidation = () => {
  return checkSchema({
    name: {
      notEmpty: {
        errorMessage: "Please enter the name of the project.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    description: {
      notEmpty: {
        errorMessage: "Please enter the description of the project.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    projectNumber: {
      notEmpty: {
        errorMessage: "Please enter the number of the project.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    clientName: {
      notEmpty: {
        errorMessage: "Please enter the client name of the project.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    createdBy: {
      notEmpty: {
        errorMessage: "Please select the person who has created the project.",
      },
    },
  });
};
