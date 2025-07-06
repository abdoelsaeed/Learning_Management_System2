const mongoose = require("mongoose");
const cron = require("node-cron");
const Assignment = require("./../models/assignment.Model"); // افتراض أن ملف assignmentSchema.js موجود

// مهمة مجدولة لتحديث حالة الواجبات
const updateAssignmentStatus = () => {
  // تشغيل كل يوم في منتصف الليل (00:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      const currentDate = new Date();
      console.log(`Checking assignments status at ${currentDate}`);

      // تحديث الواجبات التي لم تُغلق وانتهى تاريخ استحقاقها
      const result = await Assignment.updateMany(
        {
          status: { $ne: "closed" }, // الواجبات غير المغلقة
          due_date: { $lt: currentDate }, // تاريخ الاستحقاق أقل من التاريخ الحالي
        },
        {
          $set: { status: "closed" }, // تحديث الحالة إلى closed
        }
      );

      console.log(
        `Updated ${result.modifiedCount} assignments to closed status`
      );
    } catch (error) {
      console.error("Error updating assignment statuses:", error);
    }
  });
};

module.exports = updateAssignmentStatus;
