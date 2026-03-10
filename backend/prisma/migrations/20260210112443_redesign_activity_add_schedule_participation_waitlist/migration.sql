/*
  Warnings:

  - You are about to drop the column `endAt` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `communityId` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Activity_startAt_idx";

-- DropIndex
DROP INDEX "Activity_status_idx";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "endAt",
DROP COLUMN "location",
DROP COLUMN "startAt",
DROP COLUMN "status",
ADD COLUMN     "communityId" TEXT NOT NULL,
ADD COLUMN     "defaultEndTime" TEXT,
ADD COLUMN     "defaultLocation" TEXT,
ADD COLUMN     "defaultStartTime" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "recurrenceRule" TEXT;

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATTENDING',
    "isVisitor" BOOLEAN NOT NULL DEFAULT false,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Schedule_activityId_idx" ON "Schedule"("activityId");

-- CreateIndex
CREATE INDEX "Schedule_date_idx" ON "Schedule"("date");

-- CreateIndex
CREATE INDEX "Participation_userId_idx" ON "Participation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_scheduleId_userId_key" ON "Participation"("scheduleId", "userId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_scheduleId_position_idx" ON "WaitlistEntry"("scheduleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_scheduleId_userId_key" ON "WaitlistEntry"("scheduleId", "userId");

-- CreateIndex
CREATE INDEX "Activity_communityId_idx" ON "Activity"("communityId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
