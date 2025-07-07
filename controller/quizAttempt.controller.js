const QuizAttempt = require('../models/quizAttempt.Model');
const Quiz = require('../models/quizzes.Model');
const Enrollement = require('../models/enrollment.Model');
const Question = require('./../models/question.Model');

// إنشاء محاولة جديدة
exports.submitQuiz = async (req, res, next) => {
  const { quiz_id, answers } = req.body; // answers: [{question_id, answer}]
  const user_id = req.user._id;

  //validate
  if(!quiz_id) return res.status(404).json({ status: "fail", message: "you must put quiz_id" });
  if(!answers) return res.status(404).json({ status: "fail", message: "you must put array of answers" });

  // تحقق أن الكويز موجود
  const quiz = await Quiz.findById(quiz_id);
  if (!quiz)
    return res.status(404).json({ status: "fail", message: "Quiz not found" });

  // تحقق أن المستخدم مسجل في الكورس
  const isEnrolled = await Enrollement.findOne({
    user_id,
    course_id: quiz.course_id,
  });
  if (!isEnrolled)
    return res
      .status(403)
      .json({ status: "fail", message: "You are not enrolled in this course" });

  // منع تكرار المحاولة
  const existing = await QuizAttempt.findOne({ quiz_id, user_id });
  if (existing)
    return res
      .status(400)
      .json({ status: "fail", message: "You already attempted this quiz" });

  // جلب كل الأسئلة
  const questions = await Question.find({ quiz_id });
  let correct = 0;

  // حساب عدد الإجابات الصحيحة
  for (const q of questions) {
    const userAnswer = answers.find((a) => a.question_id == q._id.toString());
    if (!userAnswer) continue;

    if (q.question_type === "multiple_choice") {
      // جلب كل الخيارات الصحيحة
      const correctOptions = q.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.text);

      if (correctOptions.length === 1) {
        // اختيار واحد فقط صحيح
        if (userAnswer.answer === correctOptions[0]) {
          correct++;
        }
      } else {
        // أكثر من اختيار صحيح
        if (
          Array.isArray(userAnswer.answer) &&
          userAnswer.answer.length === correctOptions.length &&
          userAnswer.answer.sort().join(",") === correctOptions.sort().join(",")
        ) {
          correct++;
        }
      }
    } else {
      // true_false أو short_answer
      if (userAnswer.answer == q.correct_answer) {
        correct++;
      }
    }
  }

  // score = عدد الإجابات الصحيحة (أو يمكنك حساب النسبة)
  const score = correct;

  // حفظ المحاولة
  const attempt = await QuizAttempt.create({ quiz_id, user_id, score });

  res.status(201).json({
    status: "success",
    data: {
      attempt,
      totalQuestions: questions.length,
      correctAnswers: correct,
      score,
    },
  });
};

// جلب كل المحاولات لكويز معين
exports.getAttemptsByQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ status: 'fail', message: 'Quiz not found' });
    // تحقق أن المستخدم مسجل في الكورس
    const isEnrolled = await Enrollement.findOne({ user_id: req.user._id, course_id: quiz.course_id });
    if (!isEnrolled) return res.status(403).json({ status: 'fail', message: 'You are not enrolled in this course' });

    const attempts = await QuizAttempt.find({ quiz_id: quizId }).populate('user_id', 'name email');
    res.status(200).json({ status: 'success', results: attempts.length, data: { attempts } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// جلب كل المحاولات لمستخدم معين
exports.getAttemptsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    // جلب كل المحاولات لهذا المستخدم
    const attempts = await QuizAttempt.find({ user_id: userId }).populate('quiz_id', 'title course_id');
    // تحقق أن المستخدم الحالي مسجل في كل كورس مرتبط بأي محاولة
    for (const attempt of attempts) {
      const isEnrolled = await Enrollement.findOne({ user_id: req.user._id, course_id: attempt.quiz_id.course_id });
      if (!isEnrolled) return res.status(403).json({ status: 'fail', message: 'You are not enrolled in one of the courses' });
    }
    res.status(200).json({ status: 'success', results: attempts.length, data: { attempts } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// جلب محاولة واحدة
exports.getQuizAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await QuizAttempt.findById(attemptId).populate('quiz_id', 'title course_id').populate('user_id', 'name email');
    if (!attempt) return res.status(404).json({ status: 'fail', message: 'Quiz attempt not found' });
    // تحقق أن المستخدم مسجل في الكورس المرتبط بالمحاولة
    const isEnrolled = await Enrollement.findOne({ user_id: req.user._id, course_id: attempt.quiz_id.course_id });
    if (!isEnrolled) return res.status(403).json({ status: 'fail', message: 'You are not enrolled in this course' });
    res.status(200).json({ status: 'success', data: { attempt } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// حذف محاولة
exports.deleteQuizAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await QuizAttempt.findById(attemptId).populate('quiz_id', 'course_id');
    if (!attempt) return res.status(404).json({ status: 'fail', message: 'Quiz attempt not found' });
    // تحقق أن المستخدم مسجل في الكورس المرتبط بالمحاولة
    const isEnrolled = await Enrollement.findOne({ user_id: req.user._id, course_id: attempt.quiz_id.course_id });
    if (!isEnrolled) return res.status(403).json({ status: 'fail', message: 'You are not enrolled in this course' });
    await QuizAttempt.findByIdAndDelete(attemptId);
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

