import { checkSchema } from "express-validator";

export const commentValidation = () => {
  return checkSchema({
    taskId: {
      notEmpty: {
        errorMessage: "Please enter the task Id",
      },
    },
    author: {
      notEmpty: {
        errorMessage: "Please enter the author",
      },
    },
    content: {
      notEmpty: {
        errorMessage: "Enter your comment",
      },
    },
  });
};
