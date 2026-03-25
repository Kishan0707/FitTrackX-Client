const winston = require("winston");
const path = require("path");

const transports = [
  new winston.transports.File({
    filename: path.join(__dirname, "..", "..", "logs", "error.log"),
    level: "error",
  }),
  new winston.transports.File({
    filename: path.join(__dirname, "..", "..", "logs", "combined.log"),
  }),
];

if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});

module.exports = logger;
