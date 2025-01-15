import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const leaveRequestValidation = () => {
  return checkSchema({
    startDate: {
      notEmpty: {
        errorMessage: "Please enter the startDate for the leave.",
      },
      custom: {
        options: (value) => {
          const currentDate = new Date();
          const startDate = new Date(value);
          // Compare timestamps using getTime()
          if (startDate.getTime() < currentDate.setHours(0, 0, 0, 0)) {
            throw new Error("Start date cannot be in the past.");
          }
          return true;
        },
      },
    },
    endDate: {
      notEmpty: {
        errorMessage: "Please enter the end date for the leave.",
      },
      custom: {
        options: (value, { req }) => {
          const startDate = new Date(req.body.startDate);
          const endDate = new Date(value);
          // Compare timestamps using getTime()
          if (endDate.getTime() < startDate.getTime()) {
            throw new Error("End date cannot be earlier than the start date.");
          }
          return true;
        },
      },
    },
    reason: {
      notEmpty: {
        errorMessage: "Please mention the reason for the leave.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    leave_type: {
      notEmpty: {
        errorMessage: "Please select the leave type.",
      },
    },
  });
};
