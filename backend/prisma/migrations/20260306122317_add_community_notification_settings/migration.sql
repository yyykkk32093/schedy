-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "cancellationAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
