const express = require("express");

const router = express.Router();
const couponController = require('./../controller/coupon.controller')
const authController = require("../controller/Auth.controller");

router.post(
  "/",
  authController.protect,
  authController.restricted("instructor", "admin"),
  couponController.createCoupon
);
router.post(
  "/apply",
  authController.protect,
  couponController.applyCoupon
);
router.get("/:id", authController.protect, couponController.getMyCoupons);
router.get(
    "/",
    authController.protect,
    authController.restricted("admin"),
    couponController.getAllCoupons
);
router.get(
    "/:id",
    authController.protect,
    authController.restricted("instructor", "admin"),
    couponController.getCoupon
);
router.patch(
    "/:id",
    authController.protect,
    authController.restricted( "admin"),
    couponController.updateCoupon
);
router.delete(
    "/:id",
    authController.protect,
    authController.restricted("admin"),
    couponController.deleteCoupon
);
module.exports = router;
