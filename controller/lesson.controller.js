const Lesson = require('./../models/lesson.Model');
const cloudinary = require('./../utils/cloudinary');
const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const path = require('path');
const Course = require('./../models/course.Model');
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

    switch (content_type) {
        case "video":
            public_id = `lessons/videos/${file_name}_${timestamp}`;
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "video",
            public_id: public_id,
            format: file_extension,
            allowed_formats: ["mp4", "avi", "mov", "mkv", "webm"],
            transformation: [{ width: 1280, height: 720, crop: "scale" }],
            });
            break;
        case "pdf":
            public_id = `lessons/pdfs/${file_name}_${timestamp}`;
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw",
            public_id: public_id,
            format: file_extension,
            allowed_formats: ["pdf"],
            });
            content_url = `${cloudinary_result.secure_url}.${file_extension}?_a=application/pdf`;
            break;
        case "image":
            public_id = `lessons/images/${file_name}_${timestamp}`;
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            public_id: public_id,
            format: file_extension,
            allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
            transformation: [{ width: 1200, height: 800, crop: "scale" }],
            });
            break;
        case "audio":
            public_id = `lessons/audio/${file_name}_${timestamp}`;
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "video", // Cloudinary يعامل الصوت كفيديو
            public_id: public_id,
            format: file_extension,
            allowed_formats: ["mp3", "wav", "ogg", "m4a"],
            });
            break;
        default:
            return next(new AppError("Invalid content type", 400));
        }
    content_url = cloudinary_result.secure_url;

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
    const {lessonId} = req.params;
    const lesson = await Lesson.findById(lessonId).populate({path: "course_id", select: "title"});
    if(!lesson){
        return next(new AppError("Lesson not found", 404));
    }
    res.status(200).json({
        status: "success",
        data: {
        lesson,
        },
    });
});

exports.getLessons = catchAsync(async (req, res, next) => {
    const {courseId} = req.params;
    const lessons = await Lesson.find({course_id: courseId}).populate({path: "course_id", select: "title"});
    if(!lessons){
        return next(new AppError("Lessons not found", 404));
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
    console.log(lesson);
    if(!lesson){
        return next(new AppError("Lesson not found", 404));
    }
    const course = await Course.findById(lesson.course_id);
    console.log(course);
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

        // رفع الملف الجديد
        let cloudinary_result = null;

        switch (new_content_type) {
        case "video":
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "video",
            folder: "lessons/videos",
            allowed_formats: ["mp4", "avi", "mov", "mkv", "webm"],
            });
            break;

        case "pdf":
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw",
            folder: "lessons/pdfs",
            allowed_formats: ["pdf"],
            });
            break;

        case "image":
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
            folder: "lessons/images",
            allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
            });
            break;

        case "audio":
            cloudinary_result = await cloudinary.uploader.upload(req.file.path, {
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








