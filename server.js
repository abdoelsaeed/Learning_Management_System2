require("./DB/connectionDB");

const app = require("./app");
const http = require("http"); 
const socketIo = require('socket.io');
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // عدلها حسب احتياجك
    methods: ["GET", "POST"],
  },
});

// استيراد socketHandler وتفعيله
require("./utils/socketHandler")(io);

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥", err);
  // يمكنك هنا إرسال الخطأ للـ globalErrorHandler أو إغلاق السيرفر بأمان
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


module.exports = app;
