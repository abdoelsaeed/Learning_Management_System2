const AppError = require("./../error/err");
const catchAsync = require("./../error/catchAsyn");
const Course = require("./../models/course.Model");

exports.getAllCourses = catchAsync(async (req, res, next) => {
  const role = req.user && req.user.role ? req.user.role : null;  
  let filter;
  if(role === "admin"){
      filter = {
        status: ["draft", "pending", "published", "rejected", "archived"],
      };

  }
  // فلتر أساسي
 else {
    filter = { status: "published" };
  }


  // ✅ إضافة keyword search
  if (req.query.keyword) {
    const keyword = req.query.keyword;
    filter.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }

  // فلترة متقدمة
  let queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword', 'instructorName'];
  excludedFields.forEach(el => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  queryObj = JSON.parse(queryStr);

  const finalFilter = { ...filter, ...queryObj };

  // بناء الاستعلام
   let query = Course.find(finalFilter).populate('instructor', 'name email');

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-price');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // Pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  let courses = await query;

  // فلترة باسم المحاضر بعد الـ populate
  if (req.query.instructorName) {
    const instructorName = req.query.instructorName.toLowerCase();
    courses = courses.filter(course =>
      course.instructor &&
      course.instructor.name &&
      course.instructor.name.toLowerCase().includes(instructorName)
    );
  }

  res.status(200).json({
    status: "success",
    results: courses.length,
    data: {
      courses,
    },
  });
});


exports.createCourse= catchAsync(async(req,res,next)=>{
    const course = await Course.create({
        ...req.body,
        instructor: req.user.id,
        status:"draft"
    });
    
    res.status(201).json({
        status:"success",
        data:{
            course
        }
    });
});

exports.updateCourse = catchAsync(async(req,res,next)=>{
    let updatedCourse;
    const courseId = req.params.id;
    if(!courseId) return next(new AppError("Please provide course id",400));
    const course = await Course.findById(courseId);
    if(!course) return next(new AppError("No course found with this id",404));
    //! 1) if user is admin
    if(req.user.role === "admin"){
        const status = req.body.status;
        if(!status) return next(new AppError("Please provide status only",400));
        const allowedStatus = ["draft", "pending", "published", "rejected", "archived"];
        if(!allowedStatus.includes(status)){
            return next(new AppError(`Status must be one of ${allowedStatus.join(", ")}`,400));
        }
        updatedCourse = await Course.findByIdAndUpdate(courseId, {status}, {
          new: true,
          runValidators: true,
        });
        return res.status(200).json({
          status: "success",
          data: {
            course: updatedCourse,
          },
        });
    }
    
    //? 2) if user is instructor
    if (course.instructor.toString() !== req.user.id) {
  return res.status(403).json({
    status: "fail",
    message: "You are not allowed to update this course",
  });
}
  const statusAllowed = ["draft", "pending"];
  const status = req.body.status;
  if (status && !statusAllowed.includes(status)) {
    return next(new AppError(`You can only change status to ${statusAllowed.join(" or ")}`, 403));
  }
  updatedCourse = await Course.findByIdAndUpdate(courseId, req.body, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    status: "success",
    data: updatedCourse,
  });
}
);


exports.getOneCourse = catchAsync(async (req, res, next) => {
    const role = req.user && req.user.role ? req.user.role : null;
    const courseId = req.params.id;
    let course
    //* if user
    if(role === "student"){
        course = await Course.findOne({
        _id: courseId,
        status: "published",
        }).populate("instructor", "name email");
    }

    //^ if instructor
    if(role === "instructor"&& req.user.id.toString() ){
        course = await Course.findOne({
            _id: courseId,
            $or: [
            { status: "published" },
            { status: "draft", instructor: req.user.id }
            ]
        }).populate('instructor', 'name email');
        
    }

    //& if admin
    if(role === "admin"){
        course = await Course.findById(courseId).populate("instructor", "name email");
    }
    // لو الكورس مش موجود أو مش draft
    if (!course) {
        return next(new AppError("Course not found ", 404));
    }


    // لو الأمور تمام، رجّع الكورس
    res.status(200).json({
        status: "success",
        data: course,
    });
    });


 exports.deleteCourse = catchAsync(async (req, res, next) => {
  const role = req.user && req.user.role ? req.user.role : null;
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // إذا كان المستخدم instructor وصاحب الكورس
  if (role === "instructor" && course.instructor.toString() === req.user.id) {
    await Course.findByIdAndDelete(courseId);
    return res.status(204).json({
      status: "success",
      data: null,
      message: "Course deleted successfully"
    });
  }

  // إذا كان المستخدم admin
  if (role === "admin") {
    course.status = "rejected";
    await course.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "success",
      data: course,
      message: "Course status set to rejected by admin"
    });
  }

  // إذا كان المستخدم user عادي
  return res.status(403).json({
    status: "fail",
    message: "You are not authorized to delete this course"
  });
});
