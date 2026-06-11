import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { ForbiddenError } from "../../utils/errors";
import { config } from "../../config";

export const activeMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new ForbiddenError("Authentication credentials not found");
  }

  // Admin bypasses active check
  if (user.username === config.adminUsername) {
    await next();
    return;
  }

  if (user.status !== "active") {
    throw new ForbiddenError(
      "Your account is currently inactive. Please contact the administrator.",
    );
  }

  await next();
});
