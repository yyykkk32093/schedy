-- ============================================================
-- カテゴリマスター: 「スポーツ全般」追加
-- ============================================================
INSERT INTO "CategoryMaster" ("id", "name", "nameEn", "sortOrder", "communityTypeId", "createdAt")
VALUES ('cat-sports-general', 'スポーツ全般', 'Sports General', 0, 'ct-sports', NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- ParticipationLevelMaster: ラベル更新（9段階）
-- 0:未経験 1:ビギナー 2:初級 3:初中級 4:中級 5:中上級 6:上級 7:超上級 8:プロレベル
-- ============================================================
UPDATE "ParticipationLevelMaster" SET "name" = '未経験',     "nameEn" = 'No Experience'        WHERE "id" = 'pl-0';
UPDATE "ParticipationLevelMaster" SET "name" = 'ビギナー',   "nameEn" = 'Beginner'              WHERE "id" = 'pl-1';
UPDATE "ParticipationLevelMaster" SET "name" = '初級',       "nameEn" = 'Elementary'            WHERE "id" = 'pl-2';
UPDATE "ParticipationLevelMaster" SET "name" = '初中級',     "nameEn" = 'Lower Intermediate'    WHERE "id" = 'pl-3';
UPDATE "ParticipationLevelMaster" SET "name" = '中級',       "nameEn" = 'Intermediate'          WHERE "id" = 'pl-4';
UPDATE "ParticipationLevelMaster" SET "name" = '中上級',     "nameEn" = 'Upper Intermediate'    WHERE "id" = 'pl-5';
UPDATE "ParticipationLevelMaster" SET "name" = '上級',       "nameEn" = 'Advanced'              WHERE "id" = 'pl-6';
UPDATE "ParticipationLevelMaster" SET "name" = '超上級',     "nameEn" = 'Expert'                WHERE "id" = 'pl-7';
UPDATE "ParticipationLevelMaster" SET "name" = 'プロレベル', "nameEn" = 'Pro / Competitive'     WHERE "id" = 'pl-8';
