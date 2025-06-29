const Course = require("./../models/course.Model");
const Enrollement = require("./../models/enrollment.Model");
const catchAsync = require("./../error/catchAsyn");
const AppError = require("./../error/err");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Coupon = require('./../models/coupon.Model');
exports.createEnrollment = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { courseId } = req.params;
  const { couponCode } = req.body; // أو req.query
  const { success_url, cancel_url } = req.query;

  if (!courseId) {
    return next(new AppError("Please provide courseId", 400));
  }
  const course = await Course.findById(courseId);
  

  if (!course) {
    return next(new AppError("Course not found", 404));
  }
  
  let finalPrice = course.price;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode,
      expireDate: { $gt: new Date() },
    });
    if (coupon && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses)) {
      finalPrice = Math.max(0, course.price - coupon.discount);
      // يمكنك هنا زيادة usedCount لو أردت
    }
  }

  let enrollment;
  //& if the course is free
  if (+course.price == 0) {
    enrollment = await Enrollement.create({
      user_id: userId,
      course_id: courseId,
    });
    return res.status(200).json({
      status: "success",
      message: "Enrollment created successfully",
      data: {
        enrollment,
      },
    });
  }
  if (!success_url && !cancel_url && +course.price > 0) {
    return next(
      new AppError("You must put the success_url and cancel_url in query ", 404)
    );
  }
  //^ id course is not free use stripe to create a checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp", // You might want to make this configurable
          product_data: {
            name: course.title,
            description: course.description,
            images: [course.image],
          },
          unit_amount: finalPrice * 100, // Stripe expects amount in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: success_url,
    cancel_url: cancel_url,
    client_reference_id: userId.toString(),
    customer_email: req.user.email,
  });
  return res.status(200).json({
    status: "success",
    message: "Enrollment created successfully",
    data: {
      url: session.url,
      success_url: session.success_url,
      cancel_url: session.cancel_url,
      expires_at: new Date(session.expires_at * 1000),
      sessionId: session.id,
      totalPrice: session.amount_total,
    },
  });
});
