class CustomError extends Error {
  constructor(message, status, code = undefined) {
    super(message);
    this.name = this.constructor.name;

    // HTTP error code - default to 500 Internal Server Error.
    this.status = status || 500;

    // Custom error ID code for the frontend to intercept and handle.
    this.code = code;

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

class IncorrectRoleError extends CustomError {
  constructor(message = "Sorry, your account is not allowed to do that.") {
    super(message, 403, "INCORRECT-ROLE")
  }
}

class SessionInvalidError extends CustomError {
  constructor(message = "Your session has expired. Please log in again.") {
    super(message, 401, "SESSION-INVALID");
  }
}

module.exports = { CustomError, AssignmentNotFoundError, IncorrectRoleError, SessionInvalidError };
