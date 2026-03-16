/*
  Warnings:

  - Made the column `participationFee` on table `Schedule` required. This step will fail if there are existing NULL values in that column.

*/
-- Step 1: 既存の NULL を 0 に変換
UPDATE "Schedule" SET "participationFee" = 0 WHERE "participationFee" IS NULL;

-- Step 2: NOT NULL + DEFAULT 0 に変更
ALTER TABLE "Schedule" ALTER COLUMN "participationFee" SET NOT NULL,
ALTER COLUMN "participationFee" SET DEFAULT 0;
