/*
  Warnings:

  - Added the required column `errorType` to the `OutboxDeadLetter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OutboxDeadLetter" ADD COLUMN     "errorType" TEXT NOT NULL,
ADD COLUMN     "lastHttpStatus" INTEGER,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
