import { serve } from "@hono/node-server";
import { config } from "./config";
import { createApp } from "./api/app";
import { runMigrations } from "./storage/migrations";

// 1. Run database migrations at startup
try {
  runMigrations();
  console.log("[SQLite] Database migrations verified/executed successfully.");
} catch (err) {
  console.error("[SQLite] Database migrations failed:", err);
  process.exit(1);
}

// 2. Initialize app
const app = createApp();

console.log(`[Server] Environment: ${config.env}`);
console.log(`[Server] Local KB directory: ${config.kbRoot}`);
console.log(`[Server] Database file: ${config.dbPath}`);
console.log(`[Server] LLM base URL endpoint: ${config.anthropicBaseUrl}`);

// 3. Start Hono Node adapter HTTP listener
serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  (info) => {
    const displayHost =
      config.host === "0.0.0.0" || config.host === "::"
        ? "localhost"
        : config.host;
    const urlHost = displayHost.includes(":")
      ? `[${displayHost}]`
      : displayHost;
    const port = info.port;

    console.log(`[Server] Knovana API running on http://${urlHost}:${port}`);
    console.log(
      `[Server] Swagger UI (Interactive API Docs) at http://${urlHost}:${port}/api/v1/docs`,
    );
    console.log(
      `[Server] ReDoc (Static API Reference) at http://${urlHost}:${port}/api/v1/redoc`,
    );
  },
);
