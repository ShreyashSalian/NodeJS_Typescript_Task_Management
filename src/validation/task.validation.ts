import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";
import fs from "fs";

// Utility function to delete multiple files
const deleteFiles = (files: Express.Multer.File[]) => {
  files.forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Error deleting file ${file.path}:`, err);
    }
  });
};

// Allowed file types and maximum size
const allowedMimeTypes = ["image/jpeg", "image/png"];
const maxSize = 2 * 1024 * 1024; // 2MB

export const taskValidation = () => {
  return checkSchema({
    title: {
      notEmpty: {
        errorMessage: "Please enter the title of the task.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    description: {
      notEmpty: {
        errorMessage: "Please enter the task description.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    status: {
      notEmpty: {
        errorMessage: "Please enter the status of the task.",
      },
    },
    priority: {
      notEmpty: {
        errorMessage: "Please enter the priority of the task.",
      },
    },
    assignee: {
      notEmpty: {
        errorMessage: "Please select the developer for the task.",
      },
    },
    assigner: {
      notEmpty: {
        errorMessage: "Please select the assigner of the task.",
      },
    },
    assoicatedProject: {
      notEmpty: {
        errorMessage:
          "Please select the project to which this task is associated.",
      },
    },
    startDate: {
      notEmpty: {
        errorMessage: "Please select the start date of the task.",
      },
    },
    dueDate: {
      notEmpty: {
        errorMessage: "Please select the due date of the task.",
      },
    },
    attachment: {
      optional: true, // Makes the field optional
      custom: {
        options: (value, { req }) => {
          const files = req.files as Express.Multer.File[] | undefined;

          if (files && files.length > 0) {
            // Validate each file
            for (const file of files) {
              if (!allowedMimeTypes.includes(file.mimetype)) {
                deleteFiles(files);
                throw new Error("Only .jpeg and .png formats are allowed.");
              }

              if (file.size > maxSize) {
                deleteFiles(files);
                throw new Error("Image size should not exceed 2MB.");
              }
            }
          }
          return true;
        },
      },
    },
    completedTaskAttachment: {
      optional: true, // Makes the field optional
      custom: {
        options: (value, { req }) => {
          const files = req.files as Express.Multer.File[] | undefined;

          if (files && files.length > 0) {
            // Validate each file
            for (const file of files) {
              if (!allowedMimeTypes.includes(file.mimetype)) {
                deleteFiles(files);
                throw new Error("Only .jpeg and .png formats are allowed.");
              }

              if (file.size > maxSize) {
                deleteFiles(files);
                throw new Error("Image size should not exceed 2MB.");
              }
            }
          }
          return true;
        },
      },
    },
  });
};
