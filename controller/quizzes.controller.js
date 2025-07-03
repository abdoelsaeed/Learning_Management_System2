
const Quiz = require("../models/quizzes.Model");
const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const Enrollement = require('./../models/enrollment.Model')
const Course = require("../models/course.Model");

// Create Quiz
exports.createQuiz = catchAsync(async (req, res, next) => {
  const { course_id, title, time_limit } = req.body;
  const instructor_id = req.user._id;
  if (!course_id || !instructor_id || !title || !time_limit) {
    return next(
      new AppError("All fields are required [course_id, title, time_limit]", 400)
    );
  }
  // Check if the user is the owner of the course
  const course = await Course.findById(course_id);
  if (!course) return next(new AppError("Course not found", 404));
  if (String(course.instructor._id) !== String(instructor_id)) {
    return next(new AppError("You are not the owner of this course", 403));
  }
  const quiz = await Quiz.create({ course_id, instructor_id, title, time_limit });
  res.status(201).json({ status: "success", data: quiz });
});

// Get All Quizzes (with filtering, pagination)
exports.getAllQuizzes = catchAsync(async (req, res, next) => {
  const { course_id, page = 1, limit = 20 } = req.query;
  if (!course_id) {
    return next(new AppError("course_id is required to get quizzes for a course", 400));
  }

  const course = await Course.findById(course_id);
  if (!course) return next(new AppError("Course not found", 404));

  // تحقق من الصلاحيات:
  if (req.user.role === "instructor") {
    if (String(course.instructor._id || course.instructor) !== String(req.user._id)) {
      return next(new AppError("You are not the owner of this course", 403));
    }
  } else if (req.user.role === "student") {
    const isEnrolled = await Enrollement.findOne({
      user_id: req.user._id,
      course_id: course_id,
    });
    

    if (!isEnrolled) {
      return next(new AppError("You must be enrolled in this course to view its quizzes", 403));
    }
  }

  const filter = { course_id };
  const quizzes = await Quiz.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Quiz.countDocuments(filter);

  res.status(200).json({ status: "success", total, results: quizzes.length, data: quizzes });
});


// Get Single Quiz
exports.getQuiz = catchAsync(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new AppError("Quiz not found", 404));

  const course = await Course.findById(quiz.course_id);
  if (!course) return next(new AppError("Course not found", 404));

  // تحقق من الصلاحيات:
  if (req.user.role === "instructor") {
    if (String(course.instructor) !== String(req.user._id)) {
      return next(new AppError("You are not the owner of this course", 403));
    }
  } else if (req.user.role === "student") {
    const isEnrolled = await Enrollement.findOne({
      user_id: req.user._id,
      course_id: quiz.course_id,
    });

    if (!isEnrolled) {
      return next(new AppError("You must be enrolled in this course to view the quiz", 403));
    }
  }

  res.status(200).json({ status: "success", data: quiz });
});


// Update Quiz
exports.updateQuiz = catchAsync(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new AppError("Quiz not found", 404));
  // Check ownership
  if (req.user && req.user.role === "instructor") {
    const course = await Course.findById(quiz.course_id);
    if (!course || String(course.instructor) !== String(req.user._id)) {
      return next(new AppError("You are not the owner of this course", 403));
    }
  }
  Object.assign(quiz, req.body);
  await quiz.save();
  res.status(200).json({ status: "success", data: quiz });
});

// Delete Quiz
exports.deleteQuiz = catchAsync(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new AppError("Quiz not found", 404));
  // Check ownership
  if (req.user && req.user.role === "instructor") {
    const course = await Course.findById(quiz.course_id);
    if (!course || String(course.instructor) !== String(req.user._id)) {
      return next(new AppError("You are not the owner of this course", 403));
    }
  }
  await quiz.deleteOne();
  res.status(204).json({ status: "success", data: null });
});
