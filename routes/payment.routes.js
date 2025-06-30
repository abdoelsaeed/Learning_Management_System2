const express = require("express");
const authController = require("./../controller/Auth.controller");
const paymentController = require("./../controller/payment.controller");
const router = express.Router();
router.get("/", authController.protect, authController.restricted("admin"), paymentController.getAllPayments);
module.exports = router;