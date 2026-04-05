-- ============================================================
-- マスターデータ Seed
-- CommunityTypeMaster / CategoryMaster / ParticipationLevelMaster
-- ============================================================
-- 実行:
--   cd backend && PGPASSWORD=app_password psql -h localhost -p 5432 -U app_user -d reserve_manage \
--     -f infra/database/seeds/master-data-seed.sql
-- ============================================================

BEGIN;

-- ========== 1. CommunityTypeMaster ==========
INSERT INTO "CommunityTypeMaster" ("id", "name", "nameEn", "sortOrder", "createdAt")
VALUES
  ('ct-sports',    'スポーツ・サークル',       'Sports Circle',        1, NOW()),
  ('ct-corporate', '社内・ビジネス',           'Corporate / Business', 2, NOW()),
  ('ct-hobby',     '趣味・オンラインサークル', 'Hobby / Online',       3, NOW()),
  ('ct-culture',   'カルチャー',               'Culture',              4, NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name"      = EXCLUDED."name",
  "nameEn"    = EXCLUDED."nameEn",
  "sortOrder" = EXCLUDED."sortOrder";

-- ========== 2. CategoryMaster ==========
INSERT INTO "CategoryMaster" ("id", "name", "nameEn", "sortOrder", "communityTypeId", "createdAt")
VALUES
  ('cat-sports-general', 'スポーツ全般', 'Sports General', 0,  'ct-sports', NOW()),
  ('cat-badminton',      'バドミントン', 'Badminton',      1,  'ct-sports', NOW()),
  ('cat-basketball',     'バスケ',       'Basketball',     2,  'ct-sports', NOW()),
  ('cat-futsal',         'フットサル',   'Futsal',         3,  'ct-sports', NOW()),
  ('cat-running',        'ランニング',   'Running',        4,  'ct-sports', NOW()),
  ('cat-tennis',         'テニス',       'Tennis',         5,  'ct-sports', NOW()),
  ('cat-other',          '他',           'Other',          99, 'ct-hobby',  NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name"            = EXCLUDED."name",
  "nameEn"          = EXCLUDED."nameEn",
  "sortOrder"       = EXCLUDED."sortOrder",
  "communityTypeId" = EXCLUDED."communityTypeId";

-- ========== 3. ParticipationLevelMaster ==========
INSERT INTO "ParticipationLevelMaster" ("id", "name", "nameEn", "sortOrder", "createdAt")
VALUES
  ('pl-0', '未経験',     'No Experience',       0, NOW()),
  ('pl-1', 'ビギナー',   'Beginner',            1, NOW()),
  ('pl-2', '初級',       'Elementary',          2, NOW()),
  ('pl-3', '初中級',     'Lower Intermediate',  3, NOW()),
  ('pl-4', '中級',       'Intermediate',        4, NOW()),
  ('pl-5', '中上級',     'Upper Intermediate',  5, NOW()),
  ('pl-6', '上級',       'Advanced',            6, NOW()),
  ('pl-7', '超上級',     'Expert',              7, NOW()),
  ('pl-8', 'プロレベル', 'Pro / Competitive',   8, NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name"      = EXCLUDED."name",
  "nameEn"    = EXCLUDED."nameEn",
  "sortOrder" = EXCLUDED."sortOrder";

COMMIT;

-- ============================================================
-- 削除用（必要時のみコメント解除して実行）
-- ============================================================
-- DELETE FROM "CommunityParticipationLevel" WHERE true;
-- DELETE FROM "CommunityCategory" WHERE true;
-- DELETE FROM "ParticipationLevelMaster" WHERE true;
-- DELETE FROM "CategoryMaster" WHERE true;
-- DELETE FROM "CommunityTypeMaster" WHERE true;
