const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", // افتراض أن فيه موديل اسمه Course
      required: true,
    },
    instructor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // افتراض أن فيه موديل اسمه Course
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    max_points: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    due_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // يضيف createdAt و updatedAt تلقائيًا
  }
);

// إنشاء الموديل
const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
