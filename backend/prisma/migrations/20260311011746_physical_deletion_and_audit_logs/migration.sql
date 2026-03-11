/*
  Warnings:

  - You are about to drop the column `cancelledAt` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Participation` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `promotedAt` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- ============================================================
-- 1. 旧データクリーンアップ（カラム削除前に実行）
--    物理削除モデルへ移行: CANCELLED/PROMOTED レコードを削除
-- ============================================================

-- 旧 AuditLog の内容を AuthAuditLog へ移行（テーブル構造が異なるため CREATE 先行）
-- → AuditLog DROP は後段で行う

-- Participation: CANCELLED レコードを物理削除
DELETE FROM "Participation" WHERE "status" = 'CANCELLED';

-- WaitlistEntry: CANCELLED / PROMOTED レコードを物理削除
DELETE FROM "WaitlistEntry" WHERE "status" IN ('CANCELLED', 'PROMOTED');

-- ============================================================
-- 2. スキーマ変更
-- ============================================================

-- DropIndex
DROP INDEX "WaitlistEntry_scheduleId_position_idx";

-- AlterTable
ALTER TABLE "Participation" DROP COLUMN "cancelledAt",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "WaitlistEntry" DROP COLUMN "cancelledAt",
DROP COLUMN "position",
DROP COLUMN "promotedAt",
DROP COLUMN "status";

-- DropTable
DROP TABLE "AuditLog";

-- CreateTable
CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authMethod" TEXT NOT NULL,
    "detail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationAuditLog" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistAuditLog" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthAuditLog_userId_occurredAt_idx" ON "AuthAuditLog"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ParticipationAuditLog_scheduleId_createdAt_idx" ON "ParticipationAuditLog"("scheduleId", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipationAuditLog_userId_createdAt_idx" ON "ParticipationAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistAuditLog_scheduleId_createdAt_idx" ON "WaitlistAuditLog"("scheduleId", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistAuditLog_userId_createdAt_idx" ON "WaitlistAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_scheduleId_registeredAt_idx" ON "WaitlistEntry"("scheduleId", "registeredAt");

-- AddForeignKey
ALTER TABLE "ParticipationAuditLog" ADD CONSTRAINT "ParticipationAuditLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
