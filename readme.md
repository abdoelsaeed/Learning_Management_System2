# Learning Management System (LMS) Project

---

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Utilities & Background Jobs](#utilities--background-jobs)
- [Static Files & Views](#static-files--views)
- [Deployment](#deployment)
- [Future Features](#future-features)
- [Notes](#notes)

---

## Project Overview

This project is a **Learning Management System (LMS)**  built with Node.js, Express, MongoDB (Mongoose), It provides a full backend for managing users, courses, lessons (create with cloudinary, multer), assignments, quizzes, live sessions (Zoom integration), payments (Stripe), certificates(can download as pdf by use puppeteer), chat (Socket.io), cron, and more. The project is designed for extensibility, security, and real-world educational use cases.

---

## Features

- **User Authentication & Authorization**
  - Manual signup/login (JWT, sessions)
  - Social login (Google, Facebook OAuth)
  - Two-Factor Authentication (2FA) with QR code (Speakeasy)
  - Password management (reset, update, forgot)
  - Role-based access (student, instructor, admin)

- **Course Management**
  - Create, update, delete, and list courses
  - Course prerequisites, categories, and what-you-will-learn
  - Instructor assignment

- **Lesson Management**
  - Add lessons to courses (video, PDF, text, audio, etc.)
  - Track lesson progress per student
  - File uploads (Multer, Cloudinary)

- **Assignments & Submissions**
  - Create assignments per course
  - Student submissions, grading, and status tracking
  - Automated status update (cron job)

- **Quizzes & Questions**
  - Create quizzes and questions per course
  - Quiz attempts, time limits, and scoring

- **Live Sessions**
  - Schedule and manage live sessions (Zoom API integration)
  - Join links, scheduling, and instructor validation

- **Payments**
  - Stripe integration for course payments
  - Payment status tracking

- **Certificates**
  - Generate and render certificates (Pug template)

- **Reviews**
  - Students can review courses

- **Coupons**
  - Discount management for courses

- **Instructor Earnings**
  - Track instructor earnings per course

- **Chat System**
  - Real-time chat rooms per course (Socket.io)
  - User join/leave notifications

- **API Documentation**
  - Swagger/OpenAPI (swagger.yaml, /api-docs route)

- **Security**
  - CORS, rate limiting, input validation, JWT, sessions, XSS protection

---

## Authentication Details

### Social Authentication (Google & Facebook)

- **Google Login:**
  - Endpoint: `/auth/google` (redirects to Google OAuth)
  - Callback: `/auth/google/callback`
  - Requires Google OAuth credentials in `config.env` (`GOOGLE_ID`, `GOOGLE_SECRET`)
  - On success, user is authenticated and session/JWT is issued.

- **Facebook Login:**
  - Endpoint: `/auth/facebook` (redirects to Facebook OAuth)
  - Callback: `/auth/facebook/callback`
  - Requires Facebook OAuth credentials in `config.env` (`FACEBOOK_ID`, `FACEBOOK_SECRET`)
  - On success, user is authenticated and session/JWT is issued.

- **How it works:**
  1. User clicks "Login with Google/Facebook" on frontend.
  2. User is redirected to the provider's consent screen.
  3. On approval, provider redirects to callback endpoint.
  4. Backend verifies and creates/updates user, issues session/JWT.
  5. User is logged in and can access protected resources.

- **Notes:**
  - Social accounts are linked by email. If a user signs up manually and then uses Google/Facebook with the same email, accounts are merged.
  - Password is not required for social accounts.

### Two-Factor Authentication (2FA)

- **Enable 2FA:**
  - Endpoint: `POST /users/2fa/enable`
  - Requires user to be logged in.
  - Returns a QR code (base64 image) to scan with an authenticator app (e.g., Google Authenticator).

- **Verify 2FA:**
  - Endpoint: `POST /users/2fa/verify`
  - Body: `{ "token": "123456", "userId": "..." }`
  - Verifies the TOTP code from the authenticator app.
  - On success, issues a new JWT/session.

- **Login with 2FA:**
  - If 2FA is enabled, after entering email/password, the API responds with `{ message: "2FA required", userId: "..." }`.
  - User must then submit the TOTP code to `/users/2fa/verify`.

- **Disable 2FA:**
  - (If implemented) Endpoint: `POST /users/2fa/disable`

- **How it works:**
  1. User enables 2FA and scans QR code in their app.
  2. On login, after password, user is prompted for 2FA code.
  3. Backend verifies code using Speakeasy.
  4. If valid, user is logged in; otherwise, access is denied.

- **Security Notes:**
  - 2FA secrets are stored securely in the user model.
  - All sensitive actions require 2FA if enabled.

---

## Project Structure

```
├── app.js                # Main Express app, routers, middlewares, Swagger
├── server.js             # Server entry point, Socket.io setup
├── config.env            # Environment variables
├── package.json          # Dependencies and scripts
├── swagger.yaml          # OpenAPI documentation
├── public/               # Static files (chat, home pages)
├── uploads/              # Uploaded files (lessons, assignments, etc.)
├── controller/           # All business logic (auth, courses, lessons, ...)
├── routes/               # All API route definitions
├── models/               # Mongoose models (User, Course, Lesson, ...)
├── utils/                # Utilities (passport, email, cron jobs, ...)
├── views/                # Pug templates (certificate)
├── DB/                   # Database connection logic
├── error/                # Error handling (AppError, async wrapper)
├── node_modules/         # Dependencies
├── vercel.json           # Vercel deployment config
├── .gitignore            # Git ignore rules
├── LMS Schema.pdf        # Project schema (reference)
├── LMS_Project_Presentation.pptx # Project presentation
├── Sprints.pdf           # Sprints documentation
└── readme.md             # This file
```

---

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdoelsaeed/Learning_Management_System2
   cd Learning_Management_System2
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `config.env` and fill in your secrets (see [Environment Variables](#environment-variables))
4. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run start:dev
   ```
5. **Access API docs:**
   - Open [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## Environment Variables

All sensitive data and configuration are managed via `config.env`. **Never commit secrets to version control!**

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 3000) |
| NODE_ENV | Environment (development/production) |
| JWT_EXPIRES_IN | JWT token expiry (e.g., 1d) |
| DATABASE_URL | mongo DB URL  |
| JWT_SECRET | JWT signing secret |
| JWT_COOKIE_EXPIRES_IN | JWT cookie expiry (days) |
| GMAIL_USERNAME_NODEMAILER | Gmail for sending emails |
| GMAIL_PASSWORD_NODEMAILER | Gmail app password |
| GMAIL_HOST_NODEMAILER | Gmail SMTP host |
| GMAIL_PORT_NODEMAILER | Gmail SMTP port |
| EMAIL_FORM_NODEMAILER | Sender email |
| PASSPORT_SESSION | Session secret for Passport |
| FACEBOOK_SECRET | Facebook OAuth secret |
| FACEBOOK_ID | Facebook OAuth app ID |
| GOOGLE_ID | Google OAuth client ID |
| GOOGLE_SECRET | Google OAuth secret |
| STRIPE_PRIVATE_KEY | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret |
| LOCALHOST | Localhost URL |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| ZOOM_CLIENT_ID | Zoom API client ID |
| ZOOM_CLIENT_SECRET | Zoom API client secret |
| ZOOM_ACCOUNT_ID | Zoom account ID |
| ZOOM_USER_ID | Zoom user email |
| Secret_Token_Zoom | Zoom secret token |
| Verification_Token_Zoom | Zoom verification token |
| DOMAIN | Deployed domain |

---

## API Documentation

- **Swagger/OpenAPI:**
  - All endpoints are documented in `swagger.yaml` and available at `/api-docs`.
  - Tags: Auth, Courses, Enrollments, Coupons, Instructor Earnings, Payments, Lessons, Live Sessions, Quizzes, Questions, Reviews, Assignments, Submissions, Certificates.
  - Example: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Postman Collection:**
  - You can explore and test the API using the public Postman documentation:
    [https://www.postman.com/abdoelsaeed/lms/collection/ejipvu9/lms](https://www.postman.com/abdoelsaeed/lms/collection/ejipvu9/lms)

---

## Security

- **CORS:** Configured for frontend domain (change as needed)
- **Rate Limiting:** 100 requests/hour per IP
- **Sessions & JWT:** Secure user sessions and stateless auth
- **Input Validation:** On all endpoints (validator, express-validator)
- **XSS Protection:** xss package
- **SQL Injection Protection:** TypeORM and Mongoose
- **Password Hashing:** bcryptjs
- **OAuth:** Passport.js (Google, Facebook)
- **2FA:** Speakeasy + QR code

---

## Utilities & Background Jobs

- **Email Sending:** Nodemailer (utils/Email.js)
- **Passport Strategies:** Google, Facebook (utils/passport*.js)
- **Cloudinary Integration:** For file uploads (utils/cloudinary.js)
- **Assignment Status Update:** Cron job to close overdue assignments (utils/updateAssignmentStatus.js)
- **Socket.io Handler:** Real-time chat logic (utils/socketHandler.js)
- **Presentation Generator:** Generates project presentation (utils/generatePresentation.js)

---

## Static Files & Views

- **public/home.html:** Chat room join page
- **public/chat.html:** Real-time chat interface
- **views/certificate.pug:** Certificate rendering template
- **uploads/:** Stores uploaded files (lessons, assignments, etc.)

---

## Deployment

- **Vercel:** Configured via `vercel.json` for serverless deployment
- **Production Domain:** [https://learning-management-system2-abdoelsaeeds-projects.vercel.app](https://learning-management-system2-abdoelsaeeds-projects.vercel.app)
- **Environment Variables:** Set all secrets in Vercel dashboard
- **Static Files:** Served from `public/`
- **Database:** Ensure remote DB access (MongoDB Atlas, etc.)

---

## Future Features

- Course management improvements
- Advanced roles/permissions
- User profile pictures
- Email notifications
- More analytics and reporting
- Mobile app integration

---

## Notes

- **For development:**
  - Use `npm run start:dev` for hot-reloading
  - All API errors are handled via centralized error handler
  - All business logic is separated in controllers
  - All data models are in `models/`
  - All routes are in `routes/`
- **For production:**
  - Set `NODE_ENV=production`
  - Use secure secrets and production DBs
  - Configure CORS for your frontend domain

---

## Credits

- Developed by Abdelrahman (and contributors)
- For any questions, contact: abdoelsaeed290@gmail.com

---

*This README was generated to be as comprehensive and clear as possible. If you have any questions or need more details, check the code or contact with me on abdoelsaeed290@gmail.com.*
