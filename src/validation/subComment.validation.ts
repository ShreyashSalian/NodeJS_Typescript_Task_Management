import { checkSchema } from "express-validator";

export const subCommentValidation = () => {
  return checkSchema({
    commentId: {
      notEmpty: {
        errorMessage: "Please enter the commentID.",
      },
    },
    content: {
      notEmpty: {
        errorMessage: "Please enter the sub comment",
      },
    },
  });
};
