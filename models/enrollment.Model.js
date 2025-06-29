const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // أو Number لو عندك الـ id أرقام فقط
    ref: "User",
    required: true,
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId, // أو Number لو عندك الـ id أرقام فقط
    ref: "Course",
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
},{timestamps: true});
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
const Enrollement = mongoose.model("Enrollment", enrollmentSchema);
module.exports = Enrollement;
