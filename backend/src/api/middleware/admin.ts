import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { ForbiddenError } from "../../utils/errors";
import { config } from "../../config";

export const adminMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new ForbiddenError("Authentication credentials not found");
  }

  if (user.username !== config.adminUsername) {
    throw new ForbiddenError(
      "Access denied: Administrative privileges required.",
    );
  }

  await next();
});
