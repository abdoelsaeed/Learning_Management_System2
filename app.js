process.env.VERCEL_DISABLE_API_BODY_PARSER = "1";
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const express = require("express");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const userRouter = require("./routes/user.routes");
const courseRouter = require("./routes/course.routes");
const couponRouter = require("./routes/coupon.routes");
const enrollRouter = require("./routes/enrollment.routes");
const lessonRouter = require("./routes/lesson.routes");
const paymentRouter = require("./routes/payment.routes");
const liveSessionRouter = require('./routes/live_session.routes');
const instructorEarningRouter = require("./routes/instructorEarning.routes");
const enrollmentController = require("./controller/enrollment.controller");
const session = require("express-session");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const AppError = require("./error/err");
const passport = require("./utils/passport");
const globalErrorHandler = require("./controller/error.controller");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "public", "swagger.json"), "utf8")
);

const app = express();

// CORS للسماح بطلبات من أي مصدر
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"], // إضافة stripe-signature
  })
);

// Webhook endpoint *قبل* أي middlewares بتعدّل الـ body
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }), // استخدام express.raw للحفاظ على raw body
  enrollmentController.webhookCheckout
);

// باقي الـ middlewares
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.get("/favicon.ico", (req, res) => res.status(204));
app.get("/", (req, res) => res.status(204).send("Welcome to LMS API"));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/enrollments", enrollRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/lessons", lessonRouter);
app.use("/api/v1/instructor-earnings",instructorEarningRouter);
app.use("/api/v1/live-sessions",liveSessionRouter);
// Error handling for undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
