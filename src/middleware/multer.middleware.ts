import multer, { StorageEngine } from "multer";
import fs from "fs";
import path from "path";
import { Request } from "express";

// Define the storage engine with types
const storage: StorageEngine = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    const dir = "./public/attachment";

    // Check if the directory exists
    if (!fs.existsSync(dir)) {
      // Create the directory if it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname) // Keep original extension
    );
  },
});

// Export the multer instance with the specified storage engine
export const upload = multer({ storage: storage });
