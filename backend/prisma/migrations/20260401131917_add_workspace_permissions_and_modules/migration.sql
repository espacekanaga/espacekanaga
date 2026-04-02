-- CreateEnum
CREATE TYPE "AtelierServiceType" AS ENUM ('retouche', 'confection_sur_mesure', 'reparation', 'transformation', 'broderie');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessAtelier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accessPressing" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PressingLaundryType" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressingLaundryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressingArticle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "description" TEXT,
    "prixBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressingArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressingService" (
    "id" TEXT NOT NULL,
    "laundryTypeId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "dureeEstimee" INTEGER NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "PressingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "niveau" TEXT NOT NULL,
    "duree" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationInscription" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "paiement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "FormationInscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTissu" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "couleur" TEXT,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixMetre" DOUBLE PRECISION NOT NULL,
    "fournisseur" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTissu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PressingLaundryType_nom_key" ON "PressingLaundryType"("nom");

-- CreateIndex
CREATE INDEX "PressingArticle_categorie_idx" ON "PressingArticle"("categorie");

-- CreateIndex
CREATE INDEX "PressingService_articleId_idx" ON "PressingService"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "PressingService_laundryTypeId_articleId_key" ON "PressingService"("laundryTypeId", "articleId");

-- CreateIndex
CREATE INDEX "Formation_niveau_idx" ON "Formation"("niveau");

-- CreateIndex
CREATE INDEX "Formation_isActive_idx" ON "Formation"("isActive");

-- CreateIndex
CREATE INDEX "FormationInscription_clientId_idx" ON "FormationInscription"("clientId");

-- CreateIndex
CREATE INDEX "FormationInscription_statut_idx" ON "FormationInscription"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "FormationInscription_formationId_clientId_key" ON "FormationInscription"("formationId", "clientId");

-- CreateIndex
CREATE INDEX "StockTissu_type_idx" ON "StockTissu"("type");

-- CreateIndex
CREATE INDEX "StockTissu_isActive_idx" ON "StockTissu"("isActive");

-- AddForeignKey
ALTER TABLE "PressingService" ADD CONSTRAINT "PressingService_laundryTypeId_fkey" FOREIGN KEY ("laundryTypeId") REFERENCES "PressingLaundryType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressingService" ADD CONSTRAINT "PressingService_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "PressingArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationInscription" ADD CONSTRAINT "FormationInscription_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationInscription" ADD CONSTRAINT "FormationInscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
