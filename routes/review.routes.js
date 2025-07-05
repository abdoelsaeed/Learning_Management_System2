const express = require("express");
const router = express.Router();
const authController = require("./../controller/Auth.controller");
const reviewController = require('./../controller/review.controller');
router.post(
    "/course/:courseId",
    authController.protect,
    authController.restricted("student"),
    reviewController.createReview
);
router.get("/course/:courseId", reviewController.getAllReviews);
router.get("/:reviewId", reviewController.getOneReview);
router.delete("/:reviewId", authController.protect, reviewController.removeReview);
router.patch("/:reviewId", authController.protect, reviewController.updateReview);
router.get("/course/:courseId/average", reviewController.getCourseAverageRating);
module.exports = router;
