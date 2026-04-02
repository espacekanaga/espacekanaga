"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const auth_controller_1 = require("./modules/controllers/auth.controller");
const clients_controller_1 = require("./modules/controllers/clients.controller");
const orders_controller_1 = require("./modules/controllers/orders.controller");
const dashboard_controller_1 = require("./modules/controllers/dashboard.controller");
const users_controller_1 = require("./modules/controllers/users.controller");
const measurements_controller_1 = require("./modules/controllers/measurements.controller");
const invoices_controller_1 = require("./modules/controllers/invoices.controller");
const invoiceSettings_controller_1 = require("./modules/controllers/invoiceSettings.controller");
function registerRoutes(app) {
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
    app.use("/api/auth", auth_controller_1.authRouter);
    app.use("/api/settings/invoice", invoiceSettings_controller_1.invoiceSettingsRouter);
    app.use("/api/clients", clients_controller_1.clientsRouter);
    app.use("/api/orders", orders_controller_1.ordersRouter);
    app.use("/api/invoices", invoices_controller_1.invoicesRouter);
    app.use("/api/dashboard", dashboard_controller_1.dashboardRouter);
    app.use("/api/users", users_controller_1.usersRouter);
    app.use("/api/measurements", measurements_controller_1.measurementsRouter);
}
