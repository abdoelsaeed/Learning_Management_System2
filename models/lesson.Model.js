const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  content_type: {
    type: String,
    required: true,
    enum: ["video", "pdf", "text", "audio", "other"], // يمكنك تعديل الأنواع حسب الحاجة
  },
  content_url: {
    type: String,
    required: true,
  },
  lesson_order: {
    type: Number,
    required: true,
  },
  file_extension: {
    type: String,
    required: true,
  },
}, { timestamps: true });
const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
