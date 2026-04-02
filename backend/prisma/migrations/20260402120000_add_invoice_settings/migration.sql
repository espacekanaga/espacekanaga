-- CreateEnum
CREATE TYPE "InvoiceSettingsScope" AS ENUM ('global', 'pressing', 'atelier');

-- CreateTable
CREATE TABLE "InvoiceSettings" (
    "id" TEXT NOT NULL,
    "scope" "InvoiceSettingsScope" NOT NULL,
    "companyName" TEXT,
    "companyTagline" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyNIF" TEXT,
    "companyRCCM" TEXT,
    "stampEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stampLine1" TEXT,
    "stampLine2" TEXT,
    "stampLine3" TEXT,
    "stampColor" TEXT NOT NULL DEFAULT '#c41e3a',
    "footerLine1" TEXT,
    "footerLine2" TEXT,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSettings_scope_key" ON "InvoiceSettings"("scope");
