const AppError = require("./../error/err");
const catchAsync = require("./../error/catchAsyn");
const Coupon = require("./../models/coupon.Model");
const Course = require("./../models/course.Model");
exports.createCoupon = catchAsync(async (req, res, next) => {
  
  
  const coupon = await Coupon.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      coupon,
    },
  });
});

exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.find();
  res.status(200).json({
    status: "success",
    data: {
      coupons,
    },
  });
});
exports.getMyCoupons = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) return next(new AppError("Please provide user id", 400));
    const coupons = await Coupon.find({ userId });
    if (coupons.length === 0) return next(new AppError("No coupons found for this user", 404));
    res.status(200).json({
        status: "success",
        data: {
        coupons,
        },
    });
});
exports.getCoupon = catchAsync(async (req, res, next) => {
  const couponId = req.params.id;
  if (!couponId) return next(new AppError("Please provide coupon id", 400));
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new AppError("No coupon found with this id", 404));
  res.status(200).json({
    status: "success",
    data: {
      coupon,
    },
  });
});
exports.updateCoupon = catchAsync(async (req, res, next) => {
  const couponId = req.params.id;
  if (!couponId) return next(new AppError("Please provide coupon id", 400));
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new AppError("No coupon found with this id", 404));
  const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      coupon: updatedCoupon,
    },
  });
});
exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const couponId = req.params.id;
  if (!couponId) return next(new AppError("Please provide coupon id", 400));
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return next(new AppError("No coupon found with this id", 404));
  await Coupon.findByIdAndDelete(couponId);
  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode, courseId } = req.body;

  // التحقق من وجود couponCode و courseId
  if (!couponCode || !courseId) {
    return next(
      new AppError("Please provide a coupon code and course ID", 400)
    );
  }

  // البحث عن الكوبون
  const coupon = await Coupon.findOne({ code: couponCode }); // ملاحظة: استخدمت "code" بدلاً من "name" لتتماشى مع الـ Schema السابقة
  if (!coupon) {
    return next(new AppError("Invalid coupon code", 400));
  }

  // التحقق من تاريخ الصلاحية
  const course = await Course.findById(courseId);
  let finalPrice = course.price;
  if (!course) {
    // إذا لم يتم العثور على الدورة، إرجاع خطأ  finalPrice = course.price;
      return next(new AppError("Invalid course ID", 400));
    }
  if (coupon.expireDate < Date.now()) {
    return next(new AppError("This coupon has expired", 400));
  }

  // التحقق من الحد الأقصى للاستخدام
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return next(new AppError("This coupon has reached its maximum usage", 400));
  }


  // جلب الدورة للحصول على السعر

  // حساب السعر النهائي بعد الخصم
    finalPrice = course.price - (course.price * coupon.discount) / 100;
  // التأكد من أن السعر النهائي ليس سالبًا
  if (finalPrice < 0) {
    finalPrice = 0;
  }

  // تحديث عدد استخدامات الكوبون
    //! عشان اضمن ان اليوزر استخدموا فعلاcheckout هعملها في الcoupon.usedCount += 1;

  // إرجاع الاستجابة
  res.status(200).json({
    status: "success",
    data: {
      discount: coupon.discount,
      finalPrice,
      courseId,
      couponCode,
    },
  });
});
