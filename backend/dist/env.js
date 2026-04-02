"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(10),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default("30d"),
    BOOTSTRAP_TOKEN: zod_1.z.string().optional(),
    UPLOAD_DIR: zod_1.z.string().default("uploads"),
    APP_BASE_URL: zod_1.z.string().default("http://localhost:5173"),
});
exports.env = envSchema.parse(process.env);
