const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const Course = require("../models/course.Model");
const Review = require('./../models/review.Model');
exports.createReview = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;
    const { comment, rating } = req.body;

    // تحقق من وجود الكورس أولاً
    const course = await Course.findById(courseId);
    if (!course) {
        return next(new AppError("Can't find this course", 400));
    }
    if (course.status !== "published") {
        return next(new AppError("You can only review published courses", 400));
    }
    // تحقق من وجود ريفيو سابق
    const existingReview = await Review.findOne({
        user_id: req.user._id,
        course_id: courseId,
    });
    if (existingReview) {
        return next(new AppError("You put review on this course recently", 400));
    }
    // تحقق من صحة الـ rating
    if (!rating || rating < 1 || rating > 5) {
        return next(new AppError("rating must be between 1 and 5", 400));
    }

    const newReview = await Review.create({
        user_id: req.user._id,
        course_id: courseId,
        rating,
        comment: comment ? comment : undefined,
    });

    res.status(200).json({
        status: "success",
        data: {
            review: newReview,
        },
    });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "-createdAt";

    const course = await Course.findById(courseId);
    if (!course) {
        return next(new AppError("Can't find this course", 400));
    }

    const reviews = await Review.find({ course_id: courseId })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

    res.status(200).json({
        status: "success",
        data: {
            reviews,
        },
    });
});

exports.getOneReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        return next(new AppError("Review not found", 404));
    }
    res.status(200).json({
        status: "success",
        data: { review }
    });
});

exports.removeReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    
    const review = await Review.findOne({ _id: reviewId, user_id: req.user._id });
    if (!review) {
        return next(new AppError("Review not found", 404));
    }
    await review.deleteOne();
    res.status(200).json({
        status: "success",
        message: "Review deleted successfully"
    });
});

exports.updateReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    if (!req.user || !(req.user._id || req.user.id)) {
        return next(new AppError("User not authenticated", 401));
    }
    const userId = req.user._id || req.user.id;
    
    const review = await Review.findOne({ _id: reviewId, user_id: userId });
    if (!review) {
        return next(new AppError("Review not found or you are not authorized", 404));
    }

    const { comment, rating } = req.body;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
        return next(new AppError("Rating must be between 1 and 5", 400));
    }
    if (comment !== undefined) review.comment = comment;
    if (rating !== undefined) review.rating = rating;

    await review.save();
    res.status(200).json({
        status: "success",
        data: { review }
    });
});
