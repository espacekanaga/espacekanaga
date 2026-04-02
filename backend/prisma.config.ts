import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env file manually
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://moha:mohaguindo@localhost:5432/kanaga?schema=public",
  },
});
