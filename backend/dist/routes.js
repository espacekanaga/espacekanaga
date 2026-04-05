"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_controller_1 = require("./modules/controllers/auth.controller");
const clients_controller_1 = require("./modules/controllers/clients.controller");
const orders_controller_1 = require("./modules/controllers/orders.controller");
const dashboard_controller_1 = require("./modules/controllers/dashboard.controller");
const users_controller_1 = require("./modules/controllers/users.controller");
const measurements_controller_1 = require("./modules/controllers/measurements.controller");
const invoices_controller_1 = require("./modules/controllers/invoices.controller");
const invoiceSettings_controller_1 = require("./modules/controllers/invoiceSettings.controller");
const workSchedule_controller_1 = require("./modules/controllers/workSchedule.controller");
const pricing_controller_1 = require("./modules/controllers/pricing.controller");
const notifications_controller_1 = require("./modules/controllers/notifications.controller");
const prismaClient_1 = require("./prisma/prismaClient");
function registerRoutes(app) {
    // Health check
    app.get("/api/health", (_req, res) => {
        res.json({ ok: true, timestamp: new Date().toISOString() });
    });
    // Setup - create default super admin (GET for easy browser access)
    app.get("/api/setup", async (_req, res) => {
        try {
            const existing = await prismaClient_1.prisma.user.findUnique({
                where: { email: "espacekanaga@gmail.com" },
            });
            if (existing) {
                return res.json({ message: "Super admin already exists", userId: existing.id });
            }
            const passwordHash = await bcrypt_1.default.hash("espacekanaga", 10);
            const user = await prismaClient_1.prisma.user.create({
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
        }
        catch (error) {
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
    app.use("/api/auth", auth_controller_1.authRouter);
    app.get("/api/public/work-schedule", workSchedule_controller_1.getPublicWorkSchedule);
    app.get("/api/public/pricing", pricing_controller_1.getPublicPricing);
    app.use("/api/settings/pricing", pricing_controller_1.pricingRouter);
    app.use("/api/settings/invoice", invoiceSettings_controller_1.invoiceSettingsRouter);
    app.use("/api/settings/work-schedule", workSchedule_controller_1.workScheduleRouter);
    app.use("/api/clients", clients_controller_1.clientsRouter);
    app.use("/api/orders", orders_controller_1.ordersRouter);
    app.use("/api/invoices", invoices_controller_1.invoicesRouter);
    app.use("/api/dashboard", dashboard_controller_1.dashboardRouter);
    app.use("/api/users", users_controller_1.usersRouter);
    app.use("/api/measurements", measurements_controller_1.measurementsRouter);
    app.use("/api/notifications", notifications_controller_1.notificationsRouter);
}
