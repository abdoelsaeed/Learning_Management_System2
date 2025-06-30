const mongoose = require("mongoose");

const instructorEarningsSchema = new mongoose.Schema({
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });
const InstructorEarning = mongoose.model("InstructorEarnings", instructorEarningsSchema);
module.exports = InstructorEarning;
//