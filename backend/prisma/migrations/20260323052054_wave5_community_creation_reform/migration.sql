/*
  Warnings:

  - You are about to drop the column `ageRange` on the `Community` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CategoryMaster" ADD COLUMN     "communityTypeId" TEXT;

-- AlterTable
ALTER TABLE "Community" DROP COLUMN "ageRange",
ADD COLUMN     "ageMax" INTEGER,
ADD COLUMN     "ageMin" INTEGER,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "recommendedLevelMax" INTEGER,
ADD COLUMN     "recommendedLevelMin" INTEGER;

-- CreateIndex
CREATE INDEX "Community_categoryId_idx" ON "Community"("categoryId");

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryMaster" ADD CONSTRAINT "CategoryMaster_communityTypeId_fkey" FOREIGN KEY ("communityTypeId") REFERENCES "CommunityTypeMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Wave5: マスターデータ更新
-- ============================================================

-- CategoryMaster: communityTypeId を設定
UPDATE "CategoryMaster" SET "communityTypeId" = 'ct-sports' WHERE "id" IN ('cat-badminton', 'cat-basketball', 'cat-futsal', 'cat-running', 'cat-tennis');
UPDATE "CategoryMaster" SET "communityTypeId" = 'ct-hobby' WHERE "id" = 'cat-other';

-- ParticipationLevelMaster: 5段階 → 9段階に更新
DELETE FROM "CommunityParticipationLevel" WHERE true;
DELETE FROM "ParticipationLevelMaster" WHERE true;

INSERT INTO "ParticipationLevelMaster" ("id", "name", "nameEn", "sortOrder", "createdAt") VALUES
  ('pl-0', '経験不問',       'No Experience Required', 0, NOW()),
  ('pl-1', '未経験者歓迎',   'Beginners Welcome',      1, NOW()),
  ('pl-2', '初心者',         'Beginner',               2, NOW()),
  ('pl-3', '初中級者',       'Lower Intermediate',     3, NOW()),
  ('pl-4', '中級者',         'Intermediate',           4, NOW()),
  ('pl-5', '中上級者',       'Upper Intermediate',     5, NOW()),
  ('pl-6', '上級者',         'Advanced',               6, NOW()),
  ('pl-7', 'エキスパート',    'Expert',                 7, NOW()),
  ('pl-8', 'プロ・競技レベル', 'Pro / Competitive',      8, NOW());

-- ============================================================
-- Wave5: 既存データ ageRange → ageMin/ageMax マイグレーション
-- ============================================================
-- パターン: 'NN代〜NN代' → ageMin=NN, ageMax=NN+9
UPDATE "Community" SET "ageMin" = 20, "ageMax" = 49 WHERE "id" = 'e2e00000-0000-4000-a000-000000000201';
UPDATE "Community" SET "ageMin" = 20, "ageMax" = 59 WHERE "id" = 'e2e00000-0000-4000-a000-000000000202';

-- ============================================================
-- Wave5: 既存 Community に categoryId を設定（CommunityCategory → categoryId）
-- ============================================================
UPDATE "Community" c
SET "categoryId" = (
  SELECT cc."categoryId"
  FROM "CommunityCategory" cc
  WHERE cc."communityId" = c."id"
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "CommunityCategory" cc WHERE cc."communityId" = c."id"
);
