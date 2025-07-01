const express = require("express");
const liveSessionController = require("./../controller/live_session.controller");
const authController = require("./../controller/Auth.controller");
const router = express.Router();

router.post("/", authController.protect, authController.restricted("instructor"), liveSessionController.createLiveSession);
router.get(
  "/:courseId",
  authController.protect,
  liveSessionController.getLiveSessionsByCourse
);
module.exports = router;
