const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const Submission = require("../models/submission.Model");
const Assignment = require("../models/assignment.Model");
const Enrollment = require("../models/enrollment.Model"); // إضافة Enrollment

exports.createSubmission = catchAsync(async (req, res, next) => {
  const { assignmentId } = req.params;
  const { submission_url } = req.body;
  const userId = req.user.id;

  // التحقق من وجود الواجب
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  // التحقق من أن الواجب مفتوح (active)
  if (assignment.status !== "active") {
    return next(new AppError("This assignment is closed", 400));
  }

  // التحقق من أن التاريخ لم يتجاوز due_date
  if (new Date() > assignment.due_date) {
    return next(new AppError("Assignment due date has passed", 400));
  }

  // التحقق من أن الطالب مسجل في الكورس
  const enrollment = await Enrollment.findOne({
    user_id: userId,
    course_id: assignment.course_id,
  });

  if (!enrollment) {
    return next(
      new AppError(
        "You must be enrolled in this course to submit assignments",
        403
      )
    );
  }

  // التحقق من عدم وجود تسليم سابق من نفس الطالب لنفس الواجب
  const existingSubmission = await Submission.findOne({
    assignment_id: assignmentId,
    user_id: userId,
  });

  if (existingSubmission) {
    return next(
      new AppError("You have already submitted this assignment", 400)
    );
  }

  // إنشاء التسليم الجديد
  const submission = await Submission.create({
    assignment_id: assignmentId,
    user_id: userId,
    submission_url,
  });

  res.status(201).json({
    status: "success",
    data: {
      submission,
    },
  });
});

exports.getSubmissionsByAssignment = catchAsync(async (req, res, next) => {
  const { assignmentId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // التحقق من وجود الواجب
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  let submissions;

  // إذا كان المستخدم مدرس، يمكنه رؤية كل التسليمات
  if (userRole === "instructor") {
    // التحقق من أن المدرس هو منشئ الواجب
    if (assignment.instructor_id.toString() !== userId.toString()) {
      return next(
        new AppError(
          "You can only view submissions for your own assignments",
          403
        )
      );
    }

    submissions = await Submission.find({ assignment_id: assignmentId })
      .populate("user_id", "name email photo")
      .populate("assignment_id", "title description max_points due_date");
  }
  // إذا كان المستخدم طالب، يمكنه رؤية تسليمه فقط
  else if (userRole === "student") {
    submissions = await Submission.find({
      assignment_id: assignmentId,
      user_id: userId,
    }).populate("assignment_id", "title description max_points due_date");
  }

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
});

exports.getOneSubmission = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // جلب التسليم
  const submission = await Submission.findById(submissionId)
    .populate("user_id", "name email photo")
    .populate(
      "assignment_id",
      "title description max_points due_date instructor_id"
    );

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // الطالب يرى تسليمه فقط
  if (userRole === "student" && submission.user_id._id.toString() !== userId) {
    return next(
      new AppError("You do not have permission to view this submission", 403)
    );
  }

  // المدرس يرى فقط تسليمات واجباته
  if (
    userRole === "instructor" &&
    submission.assignment_id.instructor_id.toString() !== userId
  ) {
    return next(
      new AppError("You do not have permission to view this submission", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      submission,
    },
  });
}); 

exports.updateSubmission = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { submission_url, grade, feedback } = req.body;

  // جلب التسليم مع معلومات الواجب
  const submission = await Submission.findById(submissionId).populate(
    "assignment_id",
    "title due_date status instructor_id"
  );

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // التحقق من الصلاحيات
  if (userRole === "student") {
    // الطالب يمكنه تحديث تسليمه فقط
    if (submission.user_id.toString() !== userId) {
      return next(new AppError("You can only update your own submission", 403));
    }

    // التحقق من أن الواجب لم ينتهي موعده
    if (new Date() > submission.assignment_id.due_date) {
      return next(new AppError("Cannot update submission after due date", 400));
    }

    // التحقق من أن الواجب مفتوح
    if (submission.assignment_id.status !== "active") {
      return next(
        new AppError("Cannot update submission for closed assignment", 400)
      );
    }

    // الطالب يمكنه تحديث submission_url فقط
    if (grade !== undefined || feedback !== undefined) {
      return next(
        new AppError("Students cannot update grades or feedback", 403)
      );
    }

    // تحديث submission_url فقط
    if (submission_url) {
      submission.submission_url = submission_url;
    }
  } else if (userRole === "instructor") {
    // المدرس يمكنه تحديث الدرجة والـ feedback فقط
    if (submission.assignment_id.instructor_id.toString() !== userId) {
      return next(
        new AppError(
          "You can only grade submissions for your own assignments",
          403
        )
      );
    }

    // المدرس يمكنه تحديث grade و feedback فقط
    if (submission_url !== undefined) {
      return next(
        new AppError("Instructors cannot update submission URLs", 403)
      );
    }

    // تحديث الدرجة والـ feedback
    if (grade !== undefined) {
      // التحقق من أن الدرجة لا تتجاوز الحد الأقصى
      if (grade > submission.assignment_id.max_points) {
        return next(
          new AppError(
            `Grade cannot exceed ${submission.assignment_id.max_points} points`,
            400
          )
        );
      }
      if (grade < 0) {
        return next(new AppError("Grade cannot be negative", 400));
      }
      submission.grade = grade;
    }

    if (feedback !== undefined) {
      submission.feedback = feedback;
    }
  }

  // حفظ التحديثات
  await submission.save();

  // جلب التسليم المحدث مع population
  const updatedSubmission = await Submission.findById(submissionId)
    .populate("user_id", "name email photo")
    .populate(
      "assignment_id",
      "title description max_points due_date instructor_id"
    );

  res.status(200).json({
    status: "success",
    data: {
      submission: updatedSubmission,
    },
  });
});

exports.deleteSubmission = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // جلب التسليم مع معلومات الواجب
  const submission = await Submission.findById(submissionId).populate(
    "assignment_id",
    "title due_date status instructor_id"
  );

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // التحقق من الصلاحيات
  if (userRole === "student") {
    // الطالب يمكنه حذف تسليمه فقط
    if (submission.user_id.toString() !== userId) {
      return next(new AppError("You can only delete your own submission", 403));
    }

    // التحقق من أن الواجب لم ينتهي موعده
    if (new Date() > submission.assignment_id.due_date) {
      return next(new AppError("Cannot delete submission after due date", 400));
    }

    // التحقق من أن الواجب مفتوح
    if (submission.assignment_id.status !== "active") {
      return next(
        new AppError("Cannot delete submission for closed assignment", 400)
      );
    }
  } else if (userRole === "instructor") {
    // المدرس يمكنه حذف تسليمات واجباته فقط
    if (submission.assignment_id.instructor_id.toString() !== userId) {
      return next(
        new AppError(
          "You can only delete submissions for your own assignments",
          403
        )
      );
    }
  }

  // حذف التسليم
  await Submission.findByIdAndDelete(submissionId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMySubmission = catchAsync(async (req, res, next) => {
  const { assignmentId } = req.params;
  const userId = req.user.id;

  // التحقق من وجود الواجب
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  // جلب تسليم الطالب الحالي لهذا الواجب
  const submission = await Submission.findOne({
    assignment_id: assignmentId,
    user_id: userId,
  }).populate(
    "assignment_id",
    "title description max_points due_date status instructor_id"
  );

  // إذا لم يجد تسليم، يرجع null (هذا طبيعي)
  if (!submission) {
    return res.status(200).json({
      status: "success",
      data: {
        submission: null,
        message: "No submission found for this assignment",
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      submission,
    },
  });
});

exports.getMySubmissions = catchAsync(async (req, res, next) => {

  const userId = req.user.id;

  // Filters
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    graded,
    ungraded,
    courseId,
    assignmentId,
  } = req.query;

  // بناء query الأساسي
  let query = { user_id: userId };

  // تطبيق filters
  if (graded === "true") {
    query.grade = { $exists: true, $ne: null };
  }
  if (ungraded === "true") {
    query.grade = { $exists: false };
  }
  if (assignmentId) {
    query.assignment_id = assignmentId;
  }

  // حساب skip للـ pagination
  const skip = (page - 1) * limit;

  // جلب التسليمات مع filters
  const submissions = await Submission.find(query)
    .populate("user_id", "name email photo")
    .populate({
      path: "assignment_id",
      select: "title description max_points due_date status instructor_id",
      populate: {
        path: "course_id",
        select: "title description instructor_id",
      },
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // جلب العدد الإجمالي للـ pagination
  const total = await Submission.countDocuments(query);

  // حساب إحصائيات
  const gradedCount = await Submission.countDocuments({
    ...query,
    grade: { $exists: true, $ne: null },
  });
  const ungradedCount = await Submission.countDocuments({
    ...query,
    grade: { $exists: false },
  });

  const averageGrade =
    gradedCount > 0
      ? await Submission.aggregate([
          { $match: { ...query, grade: { $exists: true, $ne: null } } },
          { $group: { _id: null, avgGrade: { $avg: "$grade" } } },
        ]).then((result) => result[0]?.avgGrade || 0)
      : 0;

  res.status(200).json({
    status: "success",
    results: submissions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    stats: {
      total,
      graded: gradedCount,
      ungraded: ungradedCount,
      averageGrade: Math.round(averageGrade * 100) / 100,
    },
    data: {
      submissions,
    },
  });
});