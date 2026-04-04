"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./env");
const routes_1 = require("./routes");
function createApp() {
    const app = (0, express_1.default)();
    app.disable("x-powered-by");
    app.use((0, cors_1.default)({
        origin: [
            env_1.env.APP_BASE_URL,
            "http://localhost:5173",
            "https://espace-kanaga.netlify.app",
            "https://espace-kanaga.onrender.com",
        ],
        credentials: true,
    }));
    app.use((0, helmet_1.default)());
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    app.use((0, morgan_1.default)("dev"));
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        limit: 1000,
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.get("/health", (_req, res) => {
        res.json({ ok: true });
    });
    app.get("/", (_req, res) => {
        res.json({ name: "Espace Kanaga API", version: "0.1.0" });
    });
    // Serve static files from public folder (invoices, uploads)
    app.use("/invoices", express_1.default.static(path_1.default.join(process.cwd(), "public", "invoices")));
    app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
    (0, routes_1.registerRoutes)(app);
    return app;
}
