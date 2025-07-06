// models/lessonProgress.Model.js
const mongoose = require("mongoose");
const lessonProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  completed: { type: Boolean, default: false },
});
const LessonProgress = mongoose.model("LessonProgress", lessonProgressSchema);
module.exports = LessonProgress;
