import { prisma } from "./prismaClient";

let ensurePromise: Promise<void> | null = null;

async function ensureEnumValue(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

async function ensureClientTypeEnum(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "ClientType" AS ENUM ('pressing', 'atelier', 'both');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

async function ensureClientTypeColumn(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "clientType" "ClientType";
  `);
}

async function ensureUserThemeColumn(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'dark';
  `);
}

async function ensureClientTableTypeColumn(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Client"
    ADD COLUMN IF NOT EXISTS "clientType" "ClientType" NOT NULL DEFAULT 'both';
  `);
}

async function ensureClientEmailColumn(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Client"
    ADD COLUMN IF NOT EXISTS "email" TEXT;
  `);
}

async function ensureCoutureOrderImageColumn(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CoutureOrder"
    ADD COLUMN IF NOT EXISTS "modelImage" TEXT;
  `);
}

async function ensureWorkScheduleTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkSchedule" (
      "id" TEXT PRIMARY KEY,
      "dayOfWeek" INTEGER NOT NULL UNIQUE,
      "isOpen" BOOLEAN NOT NULL DEFAULT false,
      "openTime" TEXT,
      "closeTime" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WorkSchedule_dayOfWeek_idx"
    ON "WorkSchedule" ("dayOfWeek");
  `);
}

export async function ensureClientAuthSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        await ensureEnumValue();
        await ensureClientTypeEnum();
        await ensureClientTypeColumn();
        await ensureUserThemeColumn();
        await ensureClientEmailColumn();
        await ensureClientTableTypeColumn();
        await ensureCoutureOrderImageColumn();
        await ensureWorkScheduleTable();
      } catch (error) {
        console.warn("[api] Unable to auto-ensure client auth schema:", error);
      }
    })();
  }

  await ensurePromise;
}
