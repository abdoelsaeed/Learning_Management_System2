const express = require("express");
const multer = require("multer");
const authController = require("./../controller/Auth.controller");
const lessonController = require("./../controller/lesson.controller");
const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});
router.get("/:lessonId", authController.protect,lessonController.getLesson);
router.get("/course/:courseId",authController.protect, lessonController.getLessons);

router.use(authController.protect);
router.use(authController.restricted("instructor"));

router.post("/", upload.single("content_url"), lessonController.createLesson);
router.delete("/:lessonId", lessonController.deleteLesson);
router.patch(
  "/:lessonId",
  upload.single("content_url"),
  lessonController.updateLesson
);
module.exports = router;
