const users = [];

function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    // انضمام للغرفة
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      socket.join(room);

      // أرسل قائمة الأعضاء الحالية
      io.to(room).emit('roomUsers', {
        users: getRoomUsers(room)
      });

      // أرسل إشعار انضمام
      socket.broadcast.to(room).emit('userJoined', { username });
    });

    // استقبال رسالة شات
    socket.on('chat message', ({ username, room, message }) => {
      io.to(room).emit('chat message', { username, message });
    });

    // عند فصل الاتصال
    socket.on('disconnect', () => {
      const user = getCurrentUser(socket.id);
      if (user) {
        userLeave(socket.id);
        // أرسل إشعار مغادرة
        io.to(user.room).emit('userLeft', { username: user.username });
        // حدث قائمة الأعضاء
        io.to(user.room).emit('roomUsers', {
          users: getRoomUsers(user.room)
        });
      }
    });
  });
};
