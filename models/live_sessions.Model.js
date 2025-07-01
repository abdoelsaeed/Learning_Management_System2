const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
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
    description: {
      type: String,
    },
    session_link: {
      type: String,
      required: true,
    },
    scheduled_at: {
      type: Date,
      required: true,
    },
    duration_minutes: {
      type: Number,
      default: 40,
    },
    password_Session: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
module.exports = LiveSession;