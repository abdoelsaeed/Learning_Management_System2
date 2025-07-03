const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    time_limit: {
      type: Number, // بالدقائق مثلاً
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;