import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  BOOTSTRAP_TOKEN: z.string().optional(),
  UPLOAD_DIR: z.string().default("uploads"),
  APP_BASE_URL: z.string().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
