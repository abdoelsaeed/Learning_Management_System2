const express = require("express");
const authController = require("./../controller/Auth.controller");
const router = express.Router();
const instructorEarningController = require("./../controller/instructorEarning.controller");

//! 1) find all instructor earnings
router.get("/", authController.protect, authController.restricted("instructor"),instructorEarningController.getAllInstructorEarnings );

//? 2) find all instructor earnings for a specific course
router.get(
  "/:courseId",
  authController.protect,
  authController.restricted("instructor"),
  instructorEarningController.getInstructorEarningsByCourseId
);

//& 3) find all instructor earnings for a specific course and instructor
router.get(
  "/cousre/:courseId/instructor/:instructorId",
  authController.protect,
  authController.restricted("admin"),
  instructorEarningController.getInstructorEarningsByCourseIdAndInstructorId
);

module.exports = router;
