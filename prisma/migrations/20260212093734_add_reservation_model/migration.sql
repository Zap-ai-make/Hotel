-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientTelephone" TEXT NOT NULL,
    "chambreId" TEXT NOT NULL,
    "dateArrivee" TIMESTAMP(3) NOT NULL,
    "dateDepart" TIMESTAMP(3) NOT NULL,
    "prixTotal" DECIMAL(65,30) NOT NULL,
    "statut" "StatutReservation" NOT NULL DEFAULT 'CONFIRMEE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_chambreId_idx" ON "Reservation"("chambreId");

-- CreateIndex
CREATE INDEX "Reservation_createdById_idx" ON "Reservation"("createdById");

-- CreateIndex
CREATE INDEX "Reservation_dateArrivee_idx" ON "Reservation"("dateArrivee");

-- CreateIndex
CREATE INDEX "Reservation_dateDepart_idx" ON "Reservation"("dateDepart");

-- CreateIndex
CREATE INDEX "Reservation_statut_idx" ON "Reservation"("statut");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_chambreId_fkey" FOREIGN KEY ("chambreId") REFERENCES "Chambre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
