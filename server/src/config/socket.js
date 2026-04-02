const socketIO = require("socket.io");

let io;
const onlineUsers = new Map(); // socketId -> userId

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      socket.join(userId);
      onlineUsers.set(socket.id, userId);
      io.emit("onlineUsers", Array.from(new Set(onlineUsers.values())));
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("typing", senderId);
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("stopTyping", senderId);
    });

    // socket.on("sendMessage", async ({ receiverId, message }) => {
    //   const senderId = onlineUsers.get(socket.id);
    //   if (!senderId) return;
    //   const Message = require("../models/message.model");
    //   const msg = await Message.create({ sender: senderId, receiverId, message });
    //   io.to(receiverId.toString()).emit("receiveMessage", msg);
    // });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      io.emit("onlineUsers", Array.from(new Set(onlineUsers.values())));
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

const emitNotification = (userId, notification) => {
  if (io) {
    io.to(userId).emit("notification", notification);
  }
};

const emitWorkoutUpdate = (userId, workout) => {
  if (io) {
    io.to(userId).emit("workoutUpdate", workout);
  }
};

const emitDietUpdate = (userId, diet) => {
  if (io) {
    io.to(userId).emit("dietUpdate", diet);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitNotification,
  emitWorkoutUpdate,
  emitDietUpdate,
};
