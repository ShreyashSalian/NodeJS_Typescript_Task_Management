import mongoose from "mongoose";
import cron from "node-cron";
import { addUserAdmin } from "../utils/addAdmin";
import { Task } from "../models/task.model";

const connectDB = async (): Promise<void> => {
  try {
    const DB_URL =
      process.env.NODE_ENV === "development"
        ? `${process.env.LOCAL_PATH}/${process.env.DATABASE_NAME}`
        : `${process.env.LIVE_PATH}/${process.env.DATABASE_NAME}`;
    const connection = await mongoose.connect(DB_URL);
    console.log(`Connected to database : ${connection.connection.host}`);
    addUserAdmin();

    //Cron job to run every day at 12 AM
    cron.schedule("0 0 * * *", async () => {
      console.log("Running cron job at 12AM...");
      try {
        //Get current data
        const currentDate = new Date();
        //Find tasks with a missed due date and update their status;
        const updatedTasks = await Task.updateMany(
          {
            dueDate: { $lt: currentDate },
            status: { $ne: "completed" }, // Ensure only incomplete tasks are updated.
          },
          {
            $set: {
              status: "missed", //Update the task to "missed";
            },
          }
        );
        console.log(
          `Updated ${updatedTasks.modifiedCount} tasks with missed due dates.`
        );
      } catch (err: any) {
        console.log("Error running the cron jon", err);
        process.exit(1);
      }
    });
  } catch (err: any) {
    console.log(`Can not connect to mongoDB : `, err);
    process.exit(1);
  }
};

export default connectDB;
