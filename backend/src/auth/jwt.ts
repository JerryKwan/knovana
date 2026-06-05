import { sign, verify } from "hono/jwt";
import { config } from "../config";

export interface JWTPayload {
  sub: string;
  username: string;
  exp: number;
  [key: string]: any; // Allow index signature for compatibility with Hono's JWTPayload
}

/**
 * Generates a signed JWT token for a given user.
 */
export async function generateToken(
  userId: string,
  username: string,
): Promise<string> {
  const payload: JWTPayload = {
    sub: userId,
    username,
    exp: Math.floor(Date.now() / 1000) + config.jwtExpireDays * 24 * 60 * 60,
  };
  return sign(payload, config.jwtSecret, "HS256");
}

/**
 * Verifies a JWT token and returns the payload if successful.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const payload = await verify(token, config.jwtSecret, "HS256");
  return payload as unknown as JWTPayload;
}
