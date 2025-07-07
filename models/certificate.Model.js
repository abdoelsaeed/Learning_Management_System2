const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    // يمكنك إضافة حقول إضافية مثل رابط الشهادة أو رقم تسلسلي إذا أردت
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema); 