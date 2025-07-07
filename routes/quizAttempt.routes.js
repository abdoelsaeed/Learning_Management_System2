const express = require("express");
const router = express.Router();
const authController = require("../controller/Auth.controller");
const quizAttemptController = require("../controller/quizAttempt.controller");

router.use(authController.protect);

// إنشاء محاولة جديدة
router.post("/", quizAttemptController.submitQuiz);

// جلب كل المحاولات لكويز معين
router.get("/quiz/:quizId", quizAttemptController.getAttemptsByQuiz);

// جلب كل المحاولات لمستخدم معين
router.get("/user/:userId", quizAttemptController.getAttemptsByUser);

// جلب محاولة واحدة
router.get("/:attemptId", quizAttemptController.getQuizAttempt);

// حذف محاولة
router.delete("/:attemptId", quizAttemptController.deleteQuizAttempt);

module.exports = router; 