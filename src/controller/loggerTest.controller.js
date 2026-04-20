const logger = require("../config/logger");

exports.loggerTest = (req, res) => {
  logger.info("This is an info message");
  logger.error("This is an error message");
  logger.warn("This is a warn message");
  res.send("Check the console for logs");
};
exports.loggerTestError = (req, res) => {
  try {
    throw new Error("This is a test error");
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({
      success: false,
      message: "Error logged",
    });
  }
};
