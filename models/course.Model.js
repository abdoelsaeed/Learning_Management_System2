const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A course must have a title"],
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be less than 0"],
      required: [true, "You must put the price"],
      max: [20000, "max price is 20000"],
    },
    language: {
      type: String,
      required: [true, "You must put the language of the course"],
      enum: ["English", "Arabic", "French", "Spanish", "German", "Other"],
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "archived"],
      default: "draft",
    },
    instructor: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    whatYouWillLearn: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;