-- CreateEnum
CREATE TYPE "TypeAction" AS ENUM ('CREATION', 'MODIFICATION', 'SUPPRESSION', 'CONNEXION', 'DECONNEXION', 'ANNULATION');

-- CreateTable
CREATE TABLE "Recu" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "reservationId" TEXT NOT NULL,
    "montant" DECIMAL(65,30) NOT NULL,
    "estDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigHotel" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Hotel',
    "adresse" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigHotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "TypeAction" NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recu_numero_key" ON "Recu"("numero");

-- CreateIndex
CREATE INDEX "Recu_reservationId_idx" ON "Recu"("reservationId");

-- CreateIndex
CREATE INDEX "Recu_numero_idx" ON "Recu"("numero");

-- CreateIndex
CREATE INDEX "ActionLog_userId_idx" ON "ActionLog"("userId");

-- CreateIndex
CREATE INDEX "ActionLog_action_idx" ON "ActionLog"("action");

-- CreateIndex
CREATE INDEX "ActionLog_entite_idx" ON "ActionLog"("entite");

-- CreateIndex
CREATE INDEX "ActionLog_createdAt_idx" ON "ActionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Recu" ADD CONSTRAINT "Recu_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recu" ADD CONSTRAINT "Recu_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
