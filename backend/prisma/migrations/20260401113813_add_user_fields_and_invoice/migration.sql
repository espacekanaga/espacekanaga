/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telephone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lignes` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montantHT` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montantTTC` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montantTVA` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nom` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telephone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('emise', 'envoyee', 'payee', 'annulee', 'en_retard');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "dateEcheance" TIMESTAMP(3),
ADD COLUMN     "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "datePaiement" TIMESTAMP(3),
ADD COLUMN     "lignes" JSONB NOT NULL,
ADD COLUMN     "modePaiement" TEXT,
ADD COLUMN     "montantHT" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "montantTTC" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "montantTVA" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "numero" TEXT NOT NULL,
ADD COLUMN     "statut" "InvoiceStatus" NOT NULL DEFAULT 'emise',
ADD COLUMN     "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 18,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "filePath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "prenom" TEXT NOT NULL,
ADD COLUMN     "telephone" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_numero_key" ON "Invoice"("numero");

-- CreateIndex
CREATE INDEX "Invoice_numero_idx" ON "Invoice"("numero");

-- CreateIndex
CREATE INDEX "Invoice_statut_idx" ON "Invoice"("statut");

-- CreateIndex
CREATE INDEX "Invoice_dateEmission_idx" ON "Invoice"("dateEmission");

-- CreateIndex
CREATE UNIQUE INDEX "User_telephone_key" ON "User"("telephone");

-- CreateIndex
CREATE INDEX "User_nom_prenom_idx" ON "User"("nom", "prenom");
