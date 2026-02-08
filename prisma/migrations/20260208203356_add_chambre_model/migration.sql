-- CreateEnum
CREATE TYPE "TypeChambre" AS ENUM ('SIMPLE', 'DOUBLE', 'SUITE');

-- CreateEnum
CREATE TYPE "StatutChambre" AS ENUM ('LIBRE', 'OCCUPE');

-- CreateTable
CREATE TABLE "Chambre" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "TypeChambre" NOT NULL,
    "tarif" DECIMAL(65,30) NOT NULL,
    "statut" "StatutChambre" NOT NULL DEFAULT 'LIBRE',
    "caracteristiques" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chambre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chambre_numero_key" ON "Chambre"("numero");

-- CreateIndex
CREATE INDEX "Chambre_numero_idx" ON "Chambre"("numero");
