-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "clientId" TEXT;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_telephone_key" ON "Client"("telephone");

-- CreateIndex
CREATE INDEX "Client_telephone_idx" ON "Client"("telephone");

-- CreateIndex
CREATE INDEX "Client_nom_idx" ON "Client"("nom");

-- CreateIndex
CREATE INDEX "Reservation_clientId_idx" ON "Reservation"("clientId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
