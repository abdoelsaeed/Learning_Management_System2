const express = require("express");
const router = express.Router();
const enrollController = require("./../controller/enrollment.controller");
const authController = require('./../controller/Auth.controller');
router.post('/:courseId',
  authController.protect,
  enrollController.createEnrollment
);
router.get('/:courseId',
  authController.protect,
  authController.restricted("admin"),
  enrollController.getEnrollments
);
router.get('/admin',
  authController.protect,
  authController.restricted("admin"),
  enrollController.getAllEnrollmentsForAdmin
);
router.get('/:userId',
  authController.protect,
  authController.restricted("instructor"),
  enrollController.getAllEnrollmentsForAdmin
);
router.get(
  "/:me",
  authController.protect,
  enrollController.getMyEnrollment
);
module.exports = router;
