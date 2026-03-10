-- Seed: CommunityTypeMaster
INSERT INTO "CommunityTypeMaster" ("id", "name", "nameEn", "sortOrder", "createdAt") VALUES
  ('ct-sports',    'スポーツ・サークル',       'Sports Circle',        1, NOW()),
  ('ct-corporate', '社内・ビジネス',           'Corporate / Business', 2, NOW()),
  ('ct-hobby',     '趣味・オンラインサークル', 'Hobby / Online',       3, NOW()),
  ('ct-culture',   'カルチャー',               'Culture',              4, NOW());

-- Seed: CategoryMaster
INSERT INTO "CategoryMaster" ("id", "name", "nameEn", "sortOrder", "createdAt") VALUES
  ('cat-badminton',  'バドミントン', 'Badminton',  1,  NOW()),
  ('cat-basketball', 'バスケ',       'Basketball', 2,  NOW()),
  ('cat-futsal',     'フットサル',   'Futsal',     3,  NOW()),
  ('cat-running',    'ランニング',   'Running',    4,  NOW()),
  ('cat-tennis',     'テニス',       'Tennis',     5,  NOW()),
  ('cat-other',      '他',           'Other',      99, NOW());

-- Seed: ParticipationLevelMaster
INSERT INTO "ParticipationLevelMaster" ("id", "name", "nameEn", "sortOrder", "createdAt") VALUES
  ('pl-welcome',      '初心者歓迎', 'Beginners Welcome', 1, NOW()),
  ('pl-beginner',     '初級者',     'Beginner',          2, NOW()),
  ('pl-intermediate', '中級者',     'Intermediate',      3, NOW()),
  ('pl-advanced',     '上級者',     'Advanced',          4, NOW()),
  ('pl-noexp',        '未経験OK',   'No Experience OK',  5, NOW());