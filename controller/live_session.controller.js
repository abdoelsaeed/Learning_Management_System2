require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const LiveSession = require('../models/live_sessions.Model');
const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const Course = require('../models/course.Model');

// Function to get Zoom access token using Server-to-Server OAuth
async function getZoomAccessToken() {
  const token = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const data = qs.stringify({
    grant_type: 'account_credentials',
    account_id: process.env.ZOOM_ACCOUNT_ID,
  });

  const response = await axios.post('https://zoom.us/oauth/token', data, {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data.access_token;
}

// Controller to create a live session and Zoom meeting
exports.createLiveSession = catchAsync(async (req, res, next) => {
  try {

    const { course_id, title, description, duration_minutes, password } = req.body;
    let {scheduled_at} = req.body;
    scheduled_at = scheduled_at?scheduled_at:Date.now();
    const instructor_id = req.user._id;
    const course = await Course.findById(course_id);
    if(!course){
      return next(new AppError("can't find this course",401))
    }
    if (instructor_id.toString() !== course.instructor._id.toString()) {
      return next(
        new AppError(
          "You are not authorized to add meeting for this course",
          403
        )
      );
    }
    // 1. Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // 2. Create Zoom meeting
    const zoomResponse = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      {
        topic: title,
        type: 2, // Scheduled meeting
        start_time: new Date(scheduled_at).toISOString(),
        duration: duration_minutes,
        agenda: description,
        password_Session: password || undefined,
        settings: {
          join_before_host: true,
          approval_type: 0,
          registration_type: 1,
          enforce_login: false,
          waiting_room: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 3. Save live session to DB
    const liveSession = await LiveSession.create({
      course_id,
      instructor_id,
      title,
      description,
      session_link: zoomResponse.data.join_url,
      scheduled_at,
      duration_minutes,
    });

    res.status(201).json({ message: 'Live session created', liveSession });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create live session', details: error.response?.data || error.message });
  }
});

exports.getLiveSessionsByCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { upcoming } = req.query;

  let filter = { course_id: courseId };
  if (upcoming === "true") {
    filter.scheduled_at = { $gt: new Date() };
  }
  console.log(filter)
  const sessions = await LiveSession.find(filter).populate(
    "instructor_id",
    "name email"
  );
  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: sessions,
  });
});