-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'MOBILE_MONEY');

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "montant" DECIMAL(65,30) NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "estAcompte" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "reservationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Paiement_reservationId_idx" ON "Paiement"("reservationId");

-- CreateIndex
CREATE INDEX "Paiement_createdById_idx" ON "Paiement"("createdById");

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
