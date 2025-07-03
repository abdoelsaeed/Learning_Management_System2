
const express = require("express");
const router = express.Router();
const quizzesController = require("../controller/Quizzes.controller");
const authController = require("./../controller/Auth.controller");

// Create a quiz
router.post(
  "/",
  authController.protect,
  authController.restricted("instructor"),
  quizzesController.createQuiz
);

// Get all quizzes (with filtering & pagination)
router.get("/", authController.protect, quizzesController.getAllQuizzes);

// Get a single quiz by ID
router.get("/:id", authController.protect, quizzesController.getQuiz);

// Update a quiz by ID
router.patch(
  "/:id",
  authController.protect,
  authController.restricted("instructor"),
  quizzesController.updateQuiz
);

// Delete a quiz by ID
router.delete(
  "/:id",
  authController.protect,
  authController.restricted("instructor","admin"),
  quizzesController.deleteQuiz
);

module.exports = router;
