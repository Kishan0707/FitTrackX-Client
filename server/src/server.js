//server.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const { initializeSocket } = require("./config/socket");

const PORT = Number(process.env.PORT) || 5000;

connectDB();

const server = http.createServer(app);
initializeSocket(server);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the running process or change PORT in server/.env.`,
    );
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Socket.io initialized");
});
