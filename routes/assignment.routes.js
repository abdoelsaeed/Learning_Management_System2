const express = require("express");

const router = express.Router();
const assignmentController = require("./../controller/assignment.controller");
const authController = require("../controller/Auth.controller");

router.post(
    "/course/:courseId",
    authController.protect,
    authController.restricted("instructor"),
    assignmentController.createAssignment
);
router.get(
    "/course/:courseId",
    authController.protect,
    assignmentController.getAllAssignments
);
router.get("/:assignmentId/course/:courseId",
  authController.protect,
  assignmentController.getOneAssignment
);
router.patch(
  "/:assignmentId/course/:courseId",
  authController.protect,
  authController.restricted("instructor"),
  assignmentController.updateAssignment
);
router.delete(
  "/:assignmentId/course/:courseId",
  authController.protect,
  authController.restricted("instructor"),
  assignmentController.deleteAssignment
);
module.exports = router;
