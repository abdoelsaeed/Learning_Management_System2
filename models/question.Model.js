
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    question_text: {
      type: String,
      required: true,
    },
    question_type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer"],
      required: true,
    },
    options: [
      {
        text: { type: String, required: function() { return this.question_type === "multiple_choice"; } },
        isCorrect: { type: Boolean, default: false },
      }
    ],
    correct_answer: {
      type: String,
      required: function() {
        return this.question_type === "short_answer" || this.question_type === "true_false";
      },
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
