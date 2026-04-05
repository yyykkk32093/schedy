-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "allowVisitorWaitlist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCapacity" INTEGER,
ADD COLUMN     "defaultParticipationFee" INTEGER,
ADD COLUMN     "defaultVisitorFee" INTEGER;
