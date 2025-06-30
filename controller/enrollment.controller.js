const Course = require("./../models/course.Model");
const Enrollement = require("./../models/enrollment.Model");
const catchAsync = require("./../error/catchAsyn");
const AppError = require("./../error/err");
const Payment = require("./../models/payment.Model");
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
    metadata: {
      courseId: courseId,
      couponCode: couponCode || ""
    }
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
const createEnrollmentCheckout = async (session) => {
  try {
    const userId = session.client_reference_id;
    const sessionId = session.id;
    const amount = session.amount_total / 100; // Stripe amount is in cents
    // استخدم courseId من metadata
    const courseId = session.metadata && session.metadata.courseId;
    if (!courseId) return;
    const course = await Course.findById(courseId);
    if (!course) return;

    // تحقق إذا كان المستخدم مسجل بالفعل
    const alreadyEnrolled = await Enrollement.findOne({
      user_id: userId,
      course_id: course._id,
    });
    if (alreadyEnrolled) return;

    // أنشئ enrollment
    await Enrollement.create({
      user_id: userId,
      course_id: course._id,
    });

    // أنشئ payment
    await Payment.create({
      student_id: userId,
      course_id: course._id,
      sessionId: sessionId,
      amount: amount,
      payment_method: session.payment_method_types
        ? session.payment_method_types[0]
        : "stripe",
      payment_date: new Date(),
    });

    // (اختياري) لو فيه كوبون، حدث عدد مرات الاستخدام
    // يمكنك تمرير الكوبون في metadata عند إنشاء session
    // if (session.metadata && session.metadata.couponCode) { ... }
  } catch (err) {
    console.error("Error in createEnrollmentCheckout:", err);
  }
};
exports.webhookCheckout = async (req, res, next) => {
  console.log("Received webhook request");
  const signature = req.headers["stripe-signature"];
  console.log("Received webhook signature:", signature);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  }
  catch (err) {
    console.log("Error constructing event:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if(event.type === "checkout.session.completed"){
    console.log("Payment was successful!");
    await createEnrollmentCheckout(event.data.object);
  }
  res.status(200).json({ received: true });
};
