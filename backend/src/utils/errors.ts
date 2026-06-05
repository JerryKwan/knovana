export class KnovanaError extends Error {
  constructor(
    message: string,
    public readonly code = "INTERNAL_ERROR",
    public readonly status = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends KnovanaError {
  constructor(message = "Bad Request") {
    super(message, "BAD_REQUEST", 400);
  }
}

export class AuthError extends KnovanaError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends KnovanaError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends KnovanaError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404);
  }
}

export class AgentError extends KnovanaError {
  constructor(message: string) {
    super(message, "AGENT_ERROR", 503);
  }
}
