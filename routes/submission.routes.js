const express = require("express");
const router = express.Router();
const submissionController = require("./../controller/submissions.controller");
const authController = require("../controller/Auth.controller");

// إنشاء تسليم جديد
router.post(
  "/assignment/:assignmentId",
  authController.protect,
  authController.restricted('student'),
  submissionController.createSubmission
);

// جلب كل التسليمات لواجب معين
router.get(
  "/assignment/:assignmentId",
  authController.protect,
  submissionController.getSubmissionsByAssignment
);

// جلب تسليم واحد
router.get(
  "/:submissionId",
  authController.protect,
  submissionController.getOneSubmission
);

// تحديث تسليم
router.patch(
  "/:submissionId",
  authController.protect,
  authController.restricted("student"),
  submissionController.updateSubmission
);

// حذف تسليم
router.delete(
  "/:submissionId",
  authController.protect,
  authController.restricted("student"),
  submissionController.deleteSubmission
);

// جلب تسليم الطالب الحالي لهذا الواجب
router.get(
  "/getmysubmission/assignment/:assignmentId",
  authController.protect,
  authController.restricted("student"),
  submissionController.getMySubmission
);

router.get(
  "/get/my-submissions",
  authController.protect,
  authController.restricted("student"),
  submissionController.getMySubmissions
);

module.exports = router; 