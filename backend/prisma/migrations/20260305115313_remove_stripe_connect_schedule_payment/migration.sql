/*
  Warnings:

  - You are about to drop the `SchedulePayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StripeConnectAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SchedulePayment" DROP CONSTRAINT "SchedulePayment_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulePayment" DROP CONSTRAINT "SchedulePayment_stripeConnectAccountId_fkey";

-- DropForeignKey
ALTER TABLE "StripeConnectAccount" DROP CONSTRAINT "StripeConnectAccount_communityId_fkey";

-- DropTable
DROP TABLE "SchedulePayment";

-- DropTable
DROP TABLE "StripeConnectAccount";
