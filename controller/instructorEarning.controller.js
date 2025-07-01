const InstructorEarning = require("./../models/instructor_earnings.Model");
const catchAsync = require("./../error/catchAsyn");



// GET /api/v1/instructor-earnings/
exports.getAllInstructorEarnings = catchAsync(async (req, res, next) => {
  const earnings = await InstructorEarning.find({ instructor_id: req.user.id })
    .populate("course_id", "title")
    .sort({ date: -1 });
    const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.status(200).json({
        status: "success",
        results: earnings.length,
        totalEarnings,
        data: earnings,
    });
});


// GET /api/v1/instructor-earnings/:courseId
exports.getInstructorEarningsByCourseId = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  let filter = { course_id: courseId };

  if (req.user.role === "instructor") {
    filter.instructor_id = req.user.id; // مهم جدًا
  }

  const earnings = await InstructorEarning.find(filter)
    .populate("course_id", "title")
    .sort({ date: -1 });
  const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);


  res.status(200).json({
    status: "success",
    results: earnings.length,
    totalEarnings,
    data: earnings,
  });
});


// GET /api/v1/instructor-earnings/course/:courseId/instructor/:instructorId
exports.getInstructorEarningsByCourseIdAndInstructorId = catchAsync(async (req, res, next) => {
  const { courseId, instructorId } = req.params;

  const earnings = await InstructorEarning.find({
    course_id: courseId,
    instructor_id: instructorId
  })
    .populate("course_id", "title")
    .populate("instructor_id", "name")
    .sort({ date: -1 });
    const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);

  res.status(200).json({
    status: "success",
    results: earnings.length,
    totalEarnings,
    data: earnings,
  });
});
