import type { Express } from "express";

import { authRouter } from "./modules/controllers/auth.controller";
import { clientsRouter } from "./modules/controllers/clients.controller";
import { ordersRouter } from "./modules/controllers/orders.controller";
import { dashboardRouter } from "./modules/controllers/dashboard.controller";
import { usersRouter } from "./modules/controllers/users.controller";
import { measurementsRouter } from "./modules/controllers/measurements.controller";
import { invoicesRouter } from "./modules/controllers/invoices.controller";

export function registerRoutes(app: Express) {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Redirect API root to frontend
  app.get("/api", (_req, res) => {
    res.redirect("https://espace-kanaga.netlify.app");
  });

  // Redirect auth login GET to frontend login page
  app.get("/api/auth/login", (_req, res) => {
    res.redirect("https://espace-kanaga.netlify.app/login");
  });

  app.use("/api/auth", authRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/measurements", measurementsRouter);
}
