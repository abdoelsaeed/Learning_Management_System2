const express = require("express");
const router = express.Router();
const enrollController = require("./../controller/enrollment.controller");
const authController = require('./../controller/Auth.controller');
router.post('/:courseId',
  authController.protect,
  enrollController.createEnrollment
);
// router.get(
//   "/:me",
//   authController.protect,
//   enrollController.getMyEnrollment
// );
module.exports = router;
