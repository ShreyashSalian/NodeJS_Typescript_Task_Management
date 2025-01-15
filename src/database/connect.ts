import mongoose from "mongoose";
import cron from "node-cron";
import { addUserAdmin } from "../utils/addAdmin";
import {
  checkTaskStatusAt12AMDaily,
  updateLeaveBalanceOfEmployee,
} from "../utils/cronsJobs";

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
    cron.schedule("0 0 * * *", checkTaskStatusAt12AMDaily);

    // Schedule the job to run on the 1st of every month at midnight
    cron.schedule("0 0 1 * *", updateLeaveBalanceOfEmployee);
  } catch (err: any) {
    console.log(`Can not connect to mongoDB : `, err);
    process.exit(1);
  }
};

export default connectDB;
