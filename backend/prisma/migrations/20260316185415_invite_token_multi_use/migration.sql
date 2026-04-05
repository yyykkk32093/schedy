/*
  Warnings:

  - You are about to drop the column `usedAt` on the `InviteToken` table. All the data in the column will be lost.
  - You are about to drop the column `usedBy` on the `InviteToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InviteToken" DROP COLUMN "usedAt",
DROP COLUMN "usedBy",
ADD COLUMN     "currentUses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxUses" INTEGER;

-- CreateTable
CREATE TABLE "InviteTokenUsage" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteTokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InviteTokenUsage_tokenId_idx" ON "InviteTokenUsage"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteTokenUsage_tokenId_userId_key" ON "InviteTokenUsage"("tokenId", "userId");

-- AddForeignKey
ALTER TABLE "InviteTokenUsage" ADD CONSTRAINT "InviteTokenUsage_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "InviteToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
