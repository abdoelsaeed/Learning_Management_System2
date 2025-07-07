const express = require("express");
const router = express.Router();
const authController = require("../controller/Auth.controller");
const certificateController = require("../controller/certificate.controller");

router.use(authController.protect);

router.get("/me", certificateController.getMyCertificates);
router.get("/:courseId", certificateController.getCertificateForCourse);
router.get("/view/:certificateId", certificateController.renderCertificate);
router.get("/pdf/:certificateId", certificateController.downloadCertificatePDF);
module.exports = router;
