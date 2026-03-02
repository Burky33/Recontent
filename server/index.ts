import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, attachDevAuthUser } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();

// --- DEV FAKE AUTH (temporary) ---
// Set DEV_FAKE_AUTH=true in your .env to bypass auth locally.
if (process.env.DEV_FAKE_AUTH === "true") {
  app.use((req, _res, next) => {
    (req as any).user = {
      id: "dev-user-1",
      email: "dev@local.test",
      name: "Dev User",
      plan: "pro",
    };
    (req as any).isAuthenticated = () => true;
    next();
  });
}

attachDevAuthUser(app);

const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

serveStatic(app);

  // Railway/production needs to listen on PORT
  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(port, () => {
    log(`serving on http://localhost:${port}`);
  });
})();
