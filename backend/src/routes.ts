import type { Express } from "express";
import bcrypt from "bcrypt";

import { authRouter } from "./modules/controllers/auth.controller";
import { clientsRouter } from "./modules/controllers/clients.controller";
import { ordersRouter } from "./modules/controllers/orders.controller";
import { dashboardRouter } from "./modules/controllers/dashboard.controller";
import { usersRouter } from "./modules/controllers/users.controller";
import { measurementsRouter } from "./modules/controllers/measurements.controller";
import { invoicesRouter } from "./modules/controllers/invoices.controller";
import { invoiceSettingsRouter } from "./modules/controllers/invoiceSettings.controller";
import { getPublicWorkSchedule, workScheduleRouter } from "./modules/controllers/workSchedule.controller";
import { getPublicPricing, pricingRouter } from "./modules/controllers/pricing.controller";
import { notificationsRouter } from "./modules/controllers/notifications.controller";
import { prisma } from "./prisma/prismaClient";

export function registerRoutes(app: Express) {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Setup - create default super admin (GET for easy browser access)
  app.get("/api/setup", async (_req, res) => {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: "espacekanaga@gmail.com" },
      });
      
      if (existing) {
        return res.json({ message: "Super admin already exists", userId: existing.id });
      }
      
      const passwordHash = await bcrypt.hash("espacekanaga", 10);
      const user = await prisma.user.create({
        data: {
          prenom: "Super",
          nom: "Admin",
          telephone: "+22370000001",
          email: "espacekanaga@gmail.com",
          passwordHash,
          role: "SUPER_ADMIN",
          isActive: true,
          accessPressing: true,
          accessAtelier: true,
        },
      });
      
      res.json({ message: "Super admin created", userId: user.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create super admin", details: String(error) });
    }
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
  app.get("/api/public/work-schedule", getPublicWorkSchedule);
  app.get("/api/public/pricing", getPublicPricing);
  app.use("/api/settings/pricing", pricingRouter);
  app.use("/api/settings/invoice", invoiceSettingsRouter);
  app.use("/api/settings/work-schedule", workScheduleRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/measurements", measurementsRouter);
  app.use("/api/notifications", notificationsRouter);
}
