const express = require("express");
const authController = require("./../controller/Auth.controller");
const router = express.Router();
router.get('/',authController.protect,)
module.exports = router;
