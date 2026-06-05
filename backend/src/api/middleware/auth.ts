import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { AuthError } from "../../utils/errors";
import { verifyToken } from "../../auth/jwt";
import { UserRepository } from "../../storage/repositories/user-repo";
import { ApiKeyService } from "../../services/api-key-service";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!token) {
    throw new AuthError("Missing authorization header with Bearer token");
  }

  try {
    let userId: string;

    if (token.startsWith("sk-")) {
      const keyService = new ApiKeyService();
      const validatedUserId = await keyService.validateKey(token);
      if (!validatedUserId) {
        throw new AuthError("Invalid or revoked API Key");
      }
      userId = validatedUserId;
    } else {
      const payload = await verifyToken(token);
      userId = payload.sub;
    }

    const user = new UserRepository().findById(userId);

    if (!user) {
      throw new AuthError(
        "User associated with this credential does not exist",
      );
    }

    c.set("user", user);
    await next();
  } catch (err: any) {
    if (err instanceof AuthError) {
      throw err;
    }
    throw new AuthError(
      err.message || "Invalid or expired authorization credential",
    );
  }
});
