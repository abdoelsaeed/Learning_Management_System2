const Enrollement = require("../models/enrollment.Model");
const Quiz = require('./../models/quizzes.Model')
const catchAsync = require("./../error/catchAsyn");
const Course = require('./../models/course.Model');
const AppError = require("./../error/err");
const Question = require("../models/question.Model");

exports.createQuestion = catchAsync(async (req,res,next)=>{
    const { quiz_id, question_text, question_type, options, correct_answer } =req.body; 
    if(!quiz_id || !question_text || !question_type){
        return next(new AppError("please put all required [ quiz_id, question_text, question_type] ",401));
    }
    if(question_type==='multiple_choice' && !options){
        return next(new AppError("you must put options because question_type = multiple_choice ",401));
    }
    if (question_type !== "multiple_choice" && !correct_answer) {
        return next(new AppError("you must put correct_answer because question_type = true&false or short_answer ",401));
    }
    const quiz = await Quiz.findById(quiz_id).populate(
        "course_id",
        "instructor"
    );
    if(!quiz){
        return next(new AppError("Not found quiz",401));
    }
    if ( String(quiz.course_id.instructor._id) !== String(req.user._id)) {
        return next(new AppError("You are not the owner of this course", 403));
    }
    const question = await Question.create({
        quiz_id,
        question_text,
        question_type,
        options: question_type === "multiple_choice" ? options : undefined,
        correct_answer:question_type !== "multiple_choice" ? correct_answer : undefined,
    });

    res.status(200).json({
        status: "success",
        data: {
            question,
        },
    });
    
});

exports.getQuestions = catchAsync(async (req, res, next) => {
    const { quizId } = req.params;
    const userId = req.user._id;
    const { question_type, page = 1, limit = 20 } = req.query;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        return next(new AppError("Not found this quiz", 401));
    }
    const courseId = quiz.course_id;
    // if you are not owner this course 
    if (req.user.role === 'instructor') {
        const course = await Course.findById(courseId);
        if (!course || String(userId) !== String(course.instructor._id)) {
            return next(new AppError("You are not the owner of this course", 403));
        }
    } else {
        const isEnrolled = await Enrollement.findOne({ user_id: userId, course_id: courseId });
        if (!isEnrolled) {
            return next(new AppError("You are Not enroll this course", 401));
        }
    }

    // بناء الفلتر
    let filter = { quiz_id: quizId };
    if (question_type) filter.question_type = question_type;

    const questions = await Question.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    res.status(200).json({
        status: "success",
        results: questions.length,
        data: { questions },
    });
});

exports.updateQuestion = catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    const { question_text, question_type, options, correct_answer } = req.body;
    const userId = req.user._id;

    // التحقق من وجود السؤال
    const question = await Question.findById(questionId);
    if (!question) {
        return next(new AppError("Question not found", 404));
    }

    // التحقق من وجود الكويز
    const quiz = await Quiz.findById(question.quiz_id).populate("course_id", "instructor");
    if (!quiz) {
        return next(new AppError("Quiz not found", 404));
    }

    // التحقق من ملكية الكورس (فقط صاحب الكورس يمكنه تعديل الأسئلة)
    if (String(quiz.course_id.instructor._id) !== String(userId)) {
        return next(new AppError("You are not the owner of this course", 403));
    }

    // التحقق من البيانات المطلوبة
    if (question_type === 'multiple_choice' && !options) {
        return next(new AppError("You must put options because question_type = multiple_choice", 400));
    }
    if (question_type !== "multiple_choice" && !correct_answer) {
        return next(new AppError("You must put correct_answer because question_type = true&false or short_answer", 400));
    }

    // بناء البيانات المحدثة
    const updateData = {};
    if (question_text) updateData.question_text = question_text;
    if (question_type) updateData.question_type = question_type;
    
    if (question_type === "multiple_choice") {
        updateData.options = options;
        updateData.correct_answer = undefined;
    } else {
        updateData.correct_answer = correct_answer;
        updateData.options = undefined;
    }

    // تحديث السؤال
    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: "success",
        data: {
            question: updatedQuestion,
        },
    });
});

exports.getQuestion = catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    const userId = req.user._id;

    // التحقق من وجود السؤال
    const question = await Question.findById(questionId);
    if (!question) {
        return next(new AppError("Question not found", 404));
    }

    // التحقق من وجود الكويز
    const quiz = await Quiz.findById(question.quiz_id);
    if (!quiz) {
        return next(new AppError("Quiz not found", 404));
    }
    const courseId = quiz.course_id;

    // التحقق من الصلاحيات
    if (req.user.role === "instructor") {
        const course = await Course.findById(courseId);
        if (!course || String(userId) !== String(course.instructor._id)) {
        return next(new AppError("You are not the owner of this course", 403));
        }
    } else {
        // التحقق من enrollment للطالب
        const isEnrolled = await Enrollement.findOne({
        user_id: userId,
        course_id: courseId,
        });
        if (!isEnrolled) {
        return next(new AppError("You are not enrolled in this course", 403));
        }
    }

    res.status(200).json({
        status: "success",
        data: {
        question,
        },
    });
});



exports.deleteQuestion = catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    const userId = req.user._id;

    // التحقق من وجود السؤال
    const question = await Question.findById(questionId);
    if (!question) {
        return next(new AppError("Question not found", 404));
    }

    // التحقق من وجود الكويز
    const quiz = await Quiz.findById(question.quiz_id).populate(
        "course_id",
        "instructor"
    );
    if (!quiz) {
        return next(new AppError("Quiz not found", 404));
    }

    // التحقق من ملكية الكورس (فقط صاحب الكورس يمكنه حذف الأسئلة)
    if (String(quiz.course_id.instructor._id) !== String(userId)) {
        return next(new AppError("You are not the owner of this course", 403));
    }

    // حذف السؤال
    await Question.findByIdAndDelete(questionId);

    res.status(204).json({
        status: "success",
        data: null,
    });
});

