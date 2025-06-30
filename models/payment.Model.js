const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true, // معرف الجلسة فريد
    },
    amount: {
      type: Number,
      default: 1,
    },
    payment_method: {
      type: String,
      required: true,
      default: "card",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;