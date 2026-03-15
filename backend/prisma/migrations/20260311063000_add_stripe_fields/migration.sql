-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "Participation" ADD COLUMN     "stripePaymentIntentId" TEXT;
