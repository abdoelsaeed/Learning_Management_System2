const express = require("express");

const authController = require("./../controller/Auth.controller");
const questionController = require('./../controller/question.controller')
const router = express.Router();

router.post('/',
    authController.protect,
    authController.restricted("instructor"),
    questionController.createQuestion);

router.get("/quizId/:quizId", 
    authController.protect, 
    questionController.getQuestions);

router.get("/:questionId", 
    authController.protect, 
    questionController.getQuestion);

router.patch("/:questionId", 
    authController.protect, 
    questionController.updateQuestion);

router.delete("/:questionId", 
    authController.protect, 
    questionController.deleteQuestion);

module.exports = router;