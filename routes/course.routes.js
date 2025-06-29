const express = require("express");
const router = express.Router();
const courseController = require("./../controller/course.controller");
const authController = require('../controller/Auth.controller');
//?) for user
router.post("/",authController.protect,authController.restricted("instructor"),courseController.createCourse);
router.get("/",courseController.getAllCourses);

router.get("/:id",courseController.getOneCourse);
router.patch("/:id",authController.protect,authController.restricted("instructor"),courseController.updateCourse);

//& 3) for instructor
router.get(
    "/:id/forinstructor",
    authController.protect,
    authController.restricted("instructor"),
    courseController.getOneCourse
);
router.delete("/:id",authController.protect,authController.restricted("instructor"),courseController.deleteCourse);

//!) for admin
router.get("/foradmin",authController.protect,authController.restricted("admin"),courseController.getAllCourses);
router.get("/:id/foradmin",authController.protect,authController.restricted("admin"),courseController.getOneCourse);


router.route("/:id/foradmin").patch(authController.protect,authController.restricted("admin"),courseController.updateCourse);
router.delete("/:id/foradmin",authController.protect,authController.restricted("admin"),courseController.deleteCourse);


module.exports = router;
