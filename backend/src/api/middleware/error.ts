import type { ErrorHandler } from "hono";
import { KnovanaError } from "../../utils/errors";

/**
 * Global error handler middleware that catches all thrown errors and formats them
 * into the standardized JSON error format.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof KnovanaError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.status as any,
    );
  }

  // Log unhandled exceptions for server-side debugging
  console.error("[Error] Unhandled server exception:", err);

  // Return standard Internal Server Error
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "An unexpected internal server error occurred",
      },
    },
    500,
  );
};
