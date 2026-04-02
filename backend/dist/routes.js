"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const auth_controller_1 = require("./modules/controllers/auth.controller");
const clients_controller_1 = require("./modules/controllers/clients.controller");
const orders_controller_1 = require("./modules/controllers/orders.controller");
const dashboard_controller_1 = require("./modules/controllers/dashboard.controller");
const users_controller_1 = require("./modules/controllers/users.controller");
const measurements_controller_1 = require("./modules/controllers/measurements.controller");
function registerRoutes(app) {
    app.use("/api/auth", auth_controller_1.authRouter);
    app.use("/api/clients", clients_controller_1.clientsRouter);
    app.use("/api/orders", orders_controller_1.ordersRouter);
    app.use("/api/dashboard", dashboard_controller_1.dashboardRouter);
    app.use("/api/users", users_controller_1.usersRouter);
    app.use("/api/measurements", measurements_controller_1.measurementsRouter);
}
