// Inspired by https://dev.to/aneeqakhan/setup-error-middleware-and-async-handler-299i
const errors = require("./errors");

// Catch and handle errors thrown during request handling. If the error thrown
// if a CutsomError (with status code and message), return this. Otherwise, just
// default to error 500.
exports.errorHandler = (err, req, res, next) => {
  if (err instanceof errors.CustomError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }

  res.status(500);
  console.error(`Unhandled error occurred: ${err.message}`);
  console.error(err.stack);
  res.json({
    message: "Sorry, an unknown error occurred. Please try again.",
    details: err.message,
  });
};
