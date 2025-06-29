const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const express = require("express");
const rateLimit = require("express-rate-limit");
const userRouter = require("./routes/user.routes");
const courseRouter = require('./routes/course.routes');
const couponRouter = require('./routes/coupon.routes');
const enrollRouter = require('./routes/enrollment.routes');
const session = require('express-session'); 
const morgan = require("morgan");
const cors = require("cors");
const path = require('path');
const cookieParser = require("cookie-parser");
const AppError = require("./error/err");
const passport = require('./utils/passport');
const globalErrorHandler = require("./controller/error.controller");
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
// const swaggerDocument = require('./swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'swagger.json'), 'utf8'));
// const paymentController = require('./controller/payment.controller');

const app = express();

// app.post('/webhook', express.raw({type: 'application/json'}), paymentController.stripeWebhook);

app.use(
  cors({
    origin: "*", // أو ضع الدومين الصحيح بدلاً من *
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(passport.initialize());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/favicon.ico", (req, res) => res.status(204));
app.get("/", (req, res) => res.status(204).send('Welcome to LMS API'));

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/enrollments", enrollRouter);

app.use(express.static('public'));

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
