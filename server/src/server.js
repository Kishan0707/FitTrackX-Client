//server.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const { initializeSocket } = require("./config/socket");
connectDB();

const server = http.createServer(app);
initializeSocket(server);
server.listen(5000, () => {
  console.log("Server is running on port 5000");
  console.log("Socket.io initialized");
});
