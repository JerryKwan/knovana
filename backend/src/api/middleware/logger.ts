import { createMiddleware } from "hono/factory";

/**
 * Standard logger middleware tracking request method, URL, response status, and duration.
 */
export const loggerMiddleware = createMiddleware(async (c, next) => {
  const method = c.req.method;
  const url = c.req.url;
  const start = Date.now();

  console.log(`[HTTP] --> ${method} ${url}`);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`[HTTP] <-- ${method} ${url} - ${status} (${duration}ms)`);
});
