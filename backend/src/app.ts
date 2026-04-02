import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { env } from "./env";
import { registerRoutes } from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: [
        env.APP_BASE_URL,
        "http://localhost:5173",
        "https://espace-kanaga.netlify.app",
        "https://espace-kanaga.onrender.com",
      ],
      credentials: true,
    })
  );

  app.use(helmet());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(morgan("dev"));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (_req, res) => {
    res.json({ name: "Espace Kanaga API", version: "0.1.0" });
  });

  // Serve static files from public folder (invoices, uploads)
  app.use("/invoices", express.static(path.join(process.cwd(), "public", "invoices")));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  registerRoutes(app);

  return app;
}
