const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submission_url: {
    type: String,
    required: true,
  },
  grade: {
    type: Number,
    required: false,
  },
  feedback: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission; 