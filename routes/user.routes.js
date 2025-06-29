const express = require("express");
const router = express.Router();
const authController = require("../controller/Auth.controller");
const passport = require("./../utils/passport");
router.post("/signup", authController.signUp);
router.post("/login", authController.logIn);
// router.get("/", authController.protect, userController.getAllUsers);
router.patch(
  "/updatepassword",
  authController.protect,
  authController.updatePassword
);
router.post("/generate-2fa", authController.protect, authController.generateTwoFactorSecret);
router.post("/verify-2fa", authController.verifyTwoFactor);
router.post("/forgotpassword", authController.forgotPassword);
router.patch("/resetpassword/:code", authController.resetPassword);
router.get("/logout", authController.logout);


//? Auth with Facebook

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook"),
  passport.session({ secret: process.env.PASSPORT_SESSION }),
  authController.callback_Facebook
);

//! Auth with google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google"),
  passport.session({ secret: process.env.PASSPORT_SESSION }),
  authController.callback_google
);
module.exports = router;
