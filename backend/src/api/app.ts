import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error";
import { loggerMiddleware } from "./middleware/logger";
import { authMiddleware } from "./middleware/auth";
import { activeMiddleware } from "./middleware/active";
import { adminMiddleware } from "./middleware/admin";
import { authRoutes } from "./routes/auth";
import { chatRoutes } from "./routes/chat";
import { attachmentsRoutes } from "./routes/attachments";
import { knowledgeRoutes } from "./routes/knowledge";
import { searchRoutes } from "./routes/search";
import { settingsRoutes } from "./routes/settings";
import { keysRoutes } from "./routes/keys";
import { adminRoutes } from "./routes/admin";
import { serveStatic } from "@hono/node-server/serve-static";
import { config } from "../config";
import type { AppEnv } from "./env";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Creates and configures the Hono application instance.
 */
export function createApp() {
  const app = new OpenAPIHono<AppEnv>();

  // Register OpenAPI security scheme components for Swagger UI to show "Authorize"
  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT/ApiKey",
    description: "Enter your JWT token or API Key (starts with sk-)",
  });

  // 1. Bind global middlewares
  app.use(
    "*",
    cors({
      origin: (origin) => {
        // Simple wildcards matching for CORS origins
        if (!origin) return "*";
        const isAllowed = config.corsOrigins.some((pattern) => {
          if (pattern === "*") return true;
          if (pattern.includes("*")) {
            const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
            return regex.test(origin);
          }
          return pattern === origin;
        });
        return isAllowed ? origin : null;
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
      credentials: true,
    }),
  );

  app.use("*", loggerMiddleware);
  app.onError(errorHandler);

  // 2. Register authentication routes (Unprotected / me is protected)
  app.use("/api/v1/auth/me", authMiddleware);
  app.route("/api/v1/auth", authRoutes);

  // 3. Register protected route filters (Require authMiddleware + activeMiddleware/adminMiddleware)
  app.use("/api/v1/chat/*", authMiddleware, activeMiddleware);
  app.use("/api/v1/attachments/*", authMiddleware, activeMiddleware);
  app.use("/api/v1/knowledge/*", authMiddleware, activeMiddleware);
  app.use("/api/v1/search/*", authMiddleware, activeMiddleware);
  app.use("/api/v1/settings/*", authMiddleware, activeMiddleware);
  app.use("/api/v1/keys/*", authMiddleware, activeMiddleware);
  app.use("/api/v1/admin/*", authMiddleware, adminMiddleware);

  // 4. Mount protected route packages
  app.route("/api/v1/chat", chatRoutes);
  app.route("/api/v1/attachments", attachmentsRoutes);
  app.route("/api/v1/knowledge", knowledgeRoutes);
  app.route("/api/v1/search", searchRoutes);
  app.route("/api/v1/settings", settingsRoutes);
  app.route("/api/v1/keys", keysRoutes);
  app.route("/api/v1/admin", adminRoutes);

  // 5. Expose dynamic OpenAPI JSON document
  app.doc("/api/v1/docs/openapi.json", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Knovana API Docs",
      description:
        "Knovana backend platform API specifications. Interactive API testing console is available at /api/v1/docs (Swagger UI) and static reference at /api/v1/redoc (ReDoc).",
    },
    servers: [
      {
        url: "/",
        description: "Relative Server Path",
      },
    ],
    security: [
      {
        Bearer: [],
      },
    ],
  });

  // 6. Serve zero-dependency interactive Swagger UI testing console
  app.get("/api/v1/docs", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Knovana API Interactive Test Console (Swagger UI)</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="icon" type="image/svg+xml" href="/dashboard/favicon.svg" />
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
          <style>
            body { margin: 0; padding: 0; background-color: #fafafa; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            window.onload = () => {
              window.ui = SwaggerUIBundle({
                url: '/api/v1/docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                ],
              });
            };
          </script>
        </body>
      </html>
    `);
  });

  // 7. Serve zero-dependency interactive ReDoc documentation page
  app.get("/api/v1/redoc", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Knovana API Reference (ReDoc)</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="icon" type="image/svg+xml" href="/dashboard/favicon.svg" />
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <redoc spec-url='/api/v1/docs/openapi.json'></redoc>
          <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
        </body>
      </html>
    `);
  });

  // 8. Serve Dashboard Static Files
  app.use("/dashboard/*", serveStatic({ root: "./public" }));
  app.get("/dashboard", (c) => c.redirect("/dashboard/"));
  app.get("/favicon.svg", (c) => c.redirect("/dashboard/favicon.svg"));

  // Serve index.html as a fallback for HTML5 history client-side routes under /dashboard
  app.get("/dashboard/*", async (c, next) => {
    const path = c.req.path;
    // Skip static assets/files that contain extensions
    if (/\.[a-z0-9]+$/i.test(path)) {
      return next();
    }
    try {
      const indexPath = join(process.cwd(), "public/dashboard/index.html");
      if (existsSync(indexPath)) {
        const html = readFileSync(indexPath, "utf-8");
        return c.html(html);
      }
    } catch (err) {
      console.error("Failed to serve dashboard SPA fallback:", err);
    }
    return next();
  });

  return app;
}
