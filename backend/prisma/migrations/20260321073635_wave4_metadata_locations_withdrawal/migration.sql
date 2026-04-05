-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "UserWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "freeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityLocation" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "station" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWithdrawal_userId_key" ON "UserWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "CommunityLocation_communityId_idx" ON "CommunityLocation"("communityId");

-- AddForeignKey
ALTER TABLE "UserWithdrawal" ADD CONSTRAINT "UserWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityLocation" ADD CONSTRAINT "CommunityLocation_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
