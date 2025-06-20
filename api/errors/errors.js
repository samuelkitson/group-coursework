class CustomError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;

    // HTTP error code - default to 500 Internal Server Error.
    this.status = status || 500;

    // Capture the stack trace.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class AssignmentNotFoundError extends CustomError {
  constructor(message = "That assignment could not be found, or you're not allowed to view it.") {
    super(message, 404);
  }
}

module.exports = { CustomError, AssignmentNotFoundError };
