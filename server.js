require("./DB/connectionDB");

const app = require("./app");

const PORT = process.env.PORT || 3000;

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥", err);
  // يمكنك هنا إرسال الخطأ للـ globalErrorHandler أو إغلاق السيرفر بأمان
});

app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
});


module.exports = app;
