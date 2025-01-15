import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const designationValidator = () => {
  return checkSchema({
    // user: {
    //   notEmpty: {
    //     errorMessage: "Please select the user.",
    //   },
    // },
    joining_date: {
      notEmpty: {
        errorMessage: "Please enter the joining date.",
      },
      custom: {
        options: (value) => {
          const inputDate = new Date(value);
          const currentDate = new Date();
          if (inputDate > currentDate) {
            throw new Error("Joining date cannot be in the future.");
          }
          return true;
        },
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    dob: {
      notEmpty: {
        errorMessage: "Please enter the date of birth.",
      },
      custom: {
        options: (value) => {
          const inputDate = new Date(value);
          const currentDate = new Date();
          if (inputDate > currentDate) {
            throw new Error("BirthDate cannot be in the future.");
          }
          return true;
        },
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    contact_address: {
      notEmpty: {
        errorMessage: "Please enter the contact address.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    contact_number: {
      notEmpty: {
        errorMessage: "Please enter the contact number.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    department: {
      notEmpty: {
        errorMessage: "Please select the department.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    designation: {
      notEmpty: {
        errorMessage: "Please select the designation.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
  });
};
