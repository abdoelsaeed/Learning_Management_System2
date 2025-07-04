const Enrollement = require("../models/enrollment.Model");
const catchAsync = require("./../error/catchAsyn");
const AppError = require("./../error/err");
const Payment = require("./../models/payment.Model");
exports.getAllPayments = catchAsync(async (req, res, next) => {
  const role = req.user && req.user.role ? req.user.role : null;
  let filter;
  if (role === "admin") {
    filter = {};
  } else {
    return next(new AppError("You are not authorized to view payments", 403));
  }

  // Basic filter
  let queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  queryObj = JSON.parse(queryStr);

  const finalFilter = { ...filter, ...queryObj };

  // Build the query
  let query = Payment.find(finalFilter).populate("course_id", "title price");

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  // Pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const payments = await query;

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});


exports.getEnrollmentsForInstructor = async (req, res, next) => {
  // اولًا جيب كل الكورسات اللي تخص هذا الإنسترَكتر
  const instructorCourses = await Course.find({ instructor: req.user.id }).select('_id');

  const courseIds = instructorCourses.map(c => c._id);

  // جيب التسجيلات في الكورسات دي
  const enrollments = await Enrollement.find({ course: { $in: courseIds } })
                                      .populate('user course');

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    data: {
      enrollments
    }
  });
};
