const AppError = require("./../error/err");
const Assignment = require('./../models/assignment.Model');
const catchAsync = require("./../error/catchAsyn");
const Course = require("../models/course.Model");
const Enrollement = require("../models/enrollment.Model");

exports.createAssignment = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;
    const { title, description, max_points, due_date } = req.body;
    
    if(!title || !max_points || !due_date){
        return next(
            new AppError("put all required fields [title, max_points, due_date]", 401)
        );
    }

    const course = await Course.findById(courseId);
    if(!course){
        return next(new AppError('Not found course',401))
    }

    const instructor_id = req.user._id;
    const instructorOwnerCourse = course.instructor._id;
    if(instructor_id.toString()!==instructorOwnerCourse.toString()){
        return next(new AppError("You are not owner this course", 401));
    }

    const assignment = await Assignment.create({
        course_id: courseId,
        instructor_id,
        title,
        max_points,
        due_date,
        description: description?description:undefined,
    });
    res.status(200).json({
        status: "success",
        data: {
            assignment,
        },
    });
});

exports.getAllAssignments = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Not found course", 401));
  }

  if (req.user.role === "instructor") {
    if (userId.toString() !== course.instructor._id.toString()) {
      return next(new AppError("You are not enrolled in this course and not owner this course", 401));
    }
  } else {
    const isEnrolled = await Enrollement.findOne({
      course_id: courseId,
      user_id: userId,
    });
    if (!isEnrolled) {
      return next(new AppError("You are not enrolled in this course", 401));
    }
  }

  // فلترة حسب الدور
  let filter = { course_id: courseId };
  if (req.user.role !== "instructor") {
    filter.status = "active";
  }

  // Pagination
  const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
  const limitNum = parseInt(limit) > 0 ? parseInt(limit) : 10;
  const skip = (pageNum - 1) * limitNum;

  const assignments = await Assignment.find(filter)
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    status: "success",
    results: assignments.length,
    data: assignments,
  });
});

exports.getOneAssignment = catchAsync(async (req, res, next) => {
    const { courseId, assignmentId } = req.params;
    const userId = req.user._id;
    const course = await Course.findById(courseId);
    if (!course) {
        return next(new AppError("Not found course", 401));
    }

    let filter = { _id: assignmentId, course_id: courseId };

    if (req.user.role === "instructor") {
        if (userId.toString() !== course.instructor._id.toString()) {
            return next(new AppError("You are not enrolled in this course and not owner this course", 401));
        }
        // instructor sees any assignment
    } else {
        // تحقق من الـ enrollment للطالب فقط
        const isEnrolled = await Enrollement.findOne({
            course_id: courseId,
            user_id: userId,
        });
        if (!isEnrolled) {
            return next(new AppError("You are not enrolled in this course", 401));
        }
        // الطالب يرى فقط الواجبات active
        filter.status = "active";
    }

    const assignment = await Assignment.findOne(filter);
    if (!assignment) {
        return next(new AppError("Assignment not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: assignment,
    });
});

exports.updateAssignment = catchAsync(async (req, res, next) => {
    const { courseId, assignmentId } = req.params;
    const userId = req.user._id;
    const course = await Course.findById(courseId);
    if (!course) {
        return next(new AppError("Not found course", 401));
    }
    if (req.user.role !== "instructor" || userId.toString() !== course.instructor._id.toString()) {
        return next(new AppError("You are not owner this course", 401));
    }
    const assignment = await Assignment.findOneAndUpdate(
        { _id: assignmentId, course_id: courseId },
        req.body,
        { new: true, runValidators: true }
    );
    if (!assignment) {
        return next(new AppError("Assignment not found", 404));
    }
    res.status(200).json({
        status: "success",
        data: assignment,
    });
});

exports.deleteAssignment = catchAsync(async (req, res, next) => {
    const { courseId, assignmentId } = req.params;
    const userId = req.user._id;
    const course = await Course.findById(courseId);
    if (!course) {
        return next(new AppError("Not found course", 401));
    }
    if (req.user.role !== "instructor" || userId.toString() !== course.instructor._id.toString()) {
        return next(new AppError("You are not owner this course", 401));
    }
    const assignment = await Assignment.findOneAndDelete({ _id: assignmentId, course_id: courseId });
    if (!assignment) {
        return next(new AppError("Assignment not found", 404));
    }
    res.status(204).json({
        status: "success",
        data: null,
    });
});
