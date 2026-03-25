const socketIO = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
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
