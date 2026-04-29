const socketIO = require("socket.io");

let io;
const onlineUsers = new Map(); // socketId -> userId

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          /^https:\/\/fit-track-x-clients.*\.vercel\.app$/.test(origin) ||
          origin === "http://localhost:5173"
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
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

     // Join patient-specific progress room
     socket.on("join-progress", (patientId) => {
       const roomName = `patient_${patientId}`;
       socket.join(roomName);
       console.log(`Socket ${socket.id} joined progress room: ${roomName}`);
     });

     socket.on("typing", ({ senderId, receiverId }) => {
       io.to(receiverId).emit("typing", senderId);
     });

     socket.on("stopTyping", ({ senderId, receiverId }) => {
       io.to(receiverId).emit("stopTyping", senderId);
     });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      io.emit("onlineUsers", Array.from(new Set(onlineUsers.values())));
    });

    // ================= VIDEO CALL =================

    socket.on("join-call", async ({ roomId, userId }) => {
      const appointment = await Appointment.findOne({ roomId });

      if (!appointment) return;

      // 🔥 SECURITY CHECK
      if (
        appointment.userId.toString() !== userId &&
        appointment.doctorId.toString() !== userId
      ) {
        return socket.emit("error", "Unauthorized");
      }

      // 💰 PAYMENT CHECK
      if (appointment.paymentStatus !== "paid") {
        return socket.emit("error", "Payment required");
      }

      socket.join(roomId);
      socket.to(roomId).emit("user-joined", userId);
    });

    // OFFER
    socket.on("offer", ({ offer, roomId }) => {
      socket.to(roomId).emit("offer", offer);
    });

    // ANSWER
    socket.on("answer", ({ answer, roomId }) => {
      socket.to(roomId).emit("answer", answer);
    });

    // ICE
    socket.on("ice-candidate", ({ candidate, roomId }) => {
      socket.to(roomId).emit("ice-candidate", candidate);
    });

    // END CALL
    socket.on("end-call", ({ roomId }) => {
      socket.to(roomId).emit("call-ended");
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
