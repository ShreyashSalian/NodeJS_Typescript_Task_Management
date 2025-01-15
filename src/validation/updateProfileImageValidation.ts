import { checkSchema, Meta } from "express-validator";
import fs from "fs";

// Utility function to delete files if validation fails
const deleteFile = (file: Express.Multer.File | undefined) => {
  if (file) {
    fs.unlinkSync(file.path);
  }
};

// Allowed file types and maximum size
const allowedMimeTypes = ["image/jpeg", "image/png"];
const maxSize = 2 * 1024 * 1024; // 2MB

export const updateProfileImageValidation = () => {
  return checkSchema({
    profileImage: {
      custom: {
        options: (value: unknown, { req }: Meta) => {
          const file = (req.file as Express.Multer.File) || null;

          // Skip validation if no file is uploaded
          if (!file) {
            return true;
          }

          // Check MIME type
          if (!allowedMimeTypes.includes(file.mimetype)) {
            deleteFile(file);
            throw new Error("Only .jpeg and .png formats are allowed.");
          }

          // Check file size
          if (file.size > maxSize) {
            deleteFile(file);
            throw new Error("Image size should not exceed 2MB.");
          }

          return true; // Validation passes
        },
      },
    },
  });
};
