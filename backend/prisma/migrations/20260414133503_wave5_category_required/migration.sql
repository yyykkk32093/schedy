/*
  Wave5 Phase 2: categoryId を必須化
  - 既存の NULL レコードを 'cat-other' に移行
  - NOT NULL 制約を追加
*/

-- Step 1: 既存の NULL データを 'cat-other' に移行
UPDATE "Community" SET "categoryId" = 'cat-other' WHERE "categoryId" IS NULL;

-- Step 2: FK を再構築（nullable → non-nullable）
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_categoryId_fkey";

-- AlterTable
ALTER TABLE "Community" ALTER COLUMN "categoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
