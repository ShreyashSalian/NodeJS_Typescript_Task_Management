import { Designation } from "../models/designation.model";
import { Task } from "../models/task.model";

export const checkTaskStatusAt12AMDaily = async () => {
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
};

export const updateLeaveBalanceOfEmployee = async () => {
  await Designation.find().then((employee) => {
    employee.forEach(async (emp) => {
      const currentDate = new Date();
      const joinDate = new Date(emp.joining_date);

      //Calculate the number of months since the join Date
      const totalMonths =
        (currentDate.getFullYear() - joinDate.getFullYear()) * 12 +
        (currentDate.getMonth() - joinDate.getMonth());

      // Ensure the remaining leaves does not exceed the allowed total
      const newLeaveBalance = Math.min(totalMonths, emp.remaining_leaves + 1);

      //Update the leave balance
      emp.remaining_leaves = newLeaveBalance;
      await emp.save({ validateBeforeSave: false });
    });
  });
};
