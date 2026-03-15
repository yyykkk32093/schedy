/*
  Warnings:

  - You are about to drop the column `paymentConfirmedAt` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `paymentConfirmedBy` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReportedAt` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Participation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Participation" DROP COLUMN "paymentConfirmedAt",
DROP COLUMN "paymentConfirmedBy",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentReportedAt",
DROP COLUMN "paymentStatus",
DROP COLUMN "stripePaymentIntentId";

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripePaymentIntentId" TEXT,
    "paymentReportedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "paymentConfirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_scheduleId_userId_idx" ON "Payment"("scheduleId", "userId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
