const Lesson = require('./../models/lesson.Model');
const cloudinary = require('./../utils/cloudinary');
const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const path = require('path');
const Course = require('./../models/course.Model');
const Enrollement = require('./../models/enrollment.Model')
const LessonProgress = require('./../models/lessonProgress.Model');
const streamifier = require('streamifier');


async function updateProgress(studentId, courseId) {
  const totalLessons = await Lesson.countDocuments({ course_id: courseId });
  const completedLessons = await LessonProgress.countDocuments({
    student: studentId,
    course: courseId,
    completed: true,
  });
  const progress =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  await Enrollement.findOneAndUpdate(
    { user_id: studentId, course_id: courseId },
    { progress }
  );
}

exports.createLesson = catchAsync(async (req, res, next) => {
    const {course_id, title, description, content_type, lesson_order} = req.body;

    if (!req.file) {
        return next(new AppError("Please upload a file", 400));
    }

    const file_extension = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const file_name = path.parse(req.file.originalname).name;
    const timestamp = Date.now();
    let public_id = '';
    let cloudinary_result = null;
    let content_url = '';

    // رفع الملف إلى Cloudinary من buffer
    const streamUpload = (buffer, options) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    switch (content_type) {
        case "video":
            public_id = `lessons/videos/${file_name}_${timestamp}`;
            cloudinary_result = await streamUpload(req.file.buffer, {
              resource_type: "video",
              public_id: public_id,
              format: file_extension,
              allowed_formats: ["mp4", "avi", "mov", "mkv", "webm"],
              transformation: [{ width: 1280, height: 720, crop: "scale" }],
            });
            break;
        case "pdf":
            public_id = `lessons/pdfs/${file_name}_${timestamp}`;
            cloudinary_result = await streamUpload(req.file.buffer, {
              resource_type: "raw",
              public_id: public_id,
              format: file_extension,
              allowed_formats: ["pdf"],
            });
            content_url = `${cloudinary_result.secure_url}.${file_extension}?_a=application/pdf`;
            break;
        case "image":
            public_id = `lessons/images/${file_name}_${timestamp}`;
            cloudinary_result = await streamUpload(req.file.buffer, {
              public_id: public_id,
              format: file_extension,
              allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
              transformation: [{ width: 1200, height: 800, crop: "scale" }],
            });
            break;
        case "audio":
            public_id = `lessons/audio/${file_name}_${timestamp}`;
            cloudinary_result = await streamUpload(req.file.buffer, {
              resource_type: "video",
              public_id: public_id,
              format: file_extension,
              allowed_formats: ["mp3", "wav", "ogg", "m4a"],
            });
            break;
        default:
            return next(new AppError("Invalid content type", 400));
    }
    if (!content_url) content_url = cloudinary_result.secure_url;

    const lesson = await Lesson.create({
        title,
        description,
        course_id,
        content_type,
        content_url,
        file_extension,
        lesson_order: lesson_order || 0,
    });

    res.status(201).json({
        status: "success",
        data: {
        lesson,
        },
    });    
});

exports.getLesson = catchAsync(async (req, res, next) => {
  const { lessonId } = req.params;
  const userId = req.user._id;

  // جيب الدرس مع بيانات الكورس المرتبط
  const lesson = await Lesson.findById(lessonId).populate({
    path: "course_id",
    select: "title",
  });

  if (!lesson) {
    return next(new AppError("Lesson not found", 404));
  }

  const courseId = lesson.course_id._id;

  // تحقق من وجود enrollment لهذا المستخدم في الكورس
  const isEnrolled = await Enrollement.findOne({
    user_id: userId,
    course_id: courseId,
  });

  // لو مش مسجل، اعرض فقط العنوان وبعض التفاصيل العامة
  if (!isEnrolled) {
    return res.status(200).json({
      status: "success",
      data: {
        lesson: {
          _id: lesson._id,
          title: lesson.title,
          course_id: lesson.course_id,
          preview: true, // ممكن تضيف علامة توضح إنه Preview فقط
        },
      },
    });
  }

  // --------- حساب progress ---------
  const totalLessons = await Lesson.countDocuments({ course_id: courseId });
  const completedLessons = await LessonProgress.countDocuments({
    student: userId,
    course: courseId,
    completed: true,
  });
  const progress =totalLessons === 0? 0: Math.round((completedLessons / totalLessons) * 100);
  
  // لو مسجل، اعرض كل التفاصيل
  res.status(200).json({
    status: "success",
    data: {
      lesson,
      progress,
    },
  });
});


exports.getLessons = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // تأكد من وجود الكورس (اختياري لكن مفيد)
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }

  // تحقق من إذا كان المستخدم مسجل في الكورس
  const isEnrolled = await Enrollement.findOne({
    user_id: userId,
    course_id: courseId,
  });

  let lessons;

  if (isEnrolled) {
    // لو مسجل، اعرض كل التفاصيل
    lessons = await Lesson.find({ course_id: courseId }).populate({
      path: "course_id",
      select: "title",
    });
  } else {
    // لو مش مسجل، اعرض العناوين فقط
    lessons = await Lesson.find({ course_id: courseId })
      .select("title course_id") // عرض فقط العنوان والكورس
      .populate({
        path: "course_id",
        select: "title",
      });
  }

  res.status(200).json({
    status: "success",
    data: {
      lessons,
    },
  });
});


exports.deleteLesson = catchAsync(async (req, res, next) => {
    const {lessonId} = req.params;
    
    const lesson = await Lesson.findById(lessonId);
    
    if(!lesson){
        return next(new AppError("Lesson not found", 404));
    }
    const course = await Course.findById(lesson.course_id);
    
    if(!course){
        return next(new AppError("Course not found", 404));
    }
    if (
      req.user.role === "instructor" &&
      course.instructor._id.toString() !== req.user._id.toString()
    ) {
      return next(
        new AppError("You are not authorized to delete this lesson", 403)
      );
    }    
    await Lesson.deleteOne();
    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.updateLesson = catchAsync(async (req, res, next) => {
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
        return next(new AppError("Lesson not found", 404));
    }

    // لو فيه ملف جديد
    if (req.file) {
        const new_content_type = req.body.content_type || lesson.content_type;

        // حذف الملف القديم من Cloudinary (لو كان موجود)
        if (lesson.content_url) {
        const public_id = lesson.content_url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(public_id, {
            resource_type:
            new_content_type === "video" || new_content_type === "audio"
                ? "video"
                : "image",
        });
        }

        // رفع الملف الجديد إلى Cloudinary من buffer
        const streamUpload = (buffer, options) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
              if (result) resolve(result);
              else reject(error);
            });
            streamifier.createReadStream(buffer).pipe(stream);
          });
        };

        let cloudinary_result = null;

        switch (new_content_type) {
        case "video":
            cloudinary_result = await streamUpload(req.file.buffer, {
              resource_type: "video",
              folder: "lessons/videos",
              allowed_formats: ["mp4", "avi", "mov", "mkv", "webm"],
            });
            break;
        case "pdf":
            cloudinary_result = await streamUpload(req.file.buffer, {
              resource_type: "raw",
              folder: "lessons/pdfs",
              allowed_formats: ["pdf"],
            });
            break;
        case "image":
            cloudinary_result = await streamUpload(req.file.buffer, {
              folder: "lessons/images",
              allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
            });
            break;
        case "audio":
            cloudinary_result = await streamUpload(req.file.buffer, {
              resource_type: "video",
              folder: "lessons/audio",
              allowed_formats: ["mp3", "wav", "ogg", "m4a"],
            });
            break;
        }
        req.body.content_url = cloudinary_result.secure_url;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
        req.params.lessonId,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: "success",
        data: {
        lesson: updatedLesson,
        },
    });
});

exports.markLessonAsComplete = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { lessonId } = req.params;

  // جيب الدرس وتأكد من وجوده
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return next(new AppError("Lesson not found", 404));
  
  // تأكد أن الطالب مسجل في الكورس
  const enrollment = await Enrollement.findOne({
    user_id: userId,
    course_id: lesson.course_id,
  });
  if (!enrollment)
    return next(new AppError("You are not enrolled in this course", 403));

  // سجل التقدم (لو موجود حدثه، لو مش موجود أنشئه)
  await LessonProgress.findOneAndUpdate(
    { student: userId, course: lesson.course_id, lesson: lessonId },
    { completed: true, completedAt: new Date() },
    { upsert: true, new: true }
  );

  // --هنا استدعي تحديث progress--
  await updateProgress(userId, lesson.course_id);

  res
    .status(200)
    .json({ status: "success", message: "Lesson marked as complete" });
});









