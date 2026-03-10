-- ============================================================
-- E2E シードデータ（Phase 1〜3）
-- テストユーザー3人 + コミュニティ + アクティビティ + スケジュール
-- + 参加 / キャンセル待ち / アナウンスメント / ブックマーク
-- ============================================================
-- 実行: cd backend && PGPASSWORD=app_password psql -h localhost -p 5432 -U app_user -d reserve_manage -f infra/database/seeds/testdata/e2e-seed-data.sql
-- 削除: 末尾のDELETE文をコメント解除して実行

BEGIN;

-- ============================================================
-- 1. テストユーザー（3人）
-- ============================================================

INSERT INTO "User" ("id", "displayName", "plan", "email", "avatarUrl", "biography", "notificationSetting", "createdAt", "updatedAt")
VALUES
  ('test-user-helena-001', 'Helena', 'SUBSCRIBER', 'helena@test.com', NULL, 'テストユーザー Helena です', '{}', NOW(), NOW()),
  ('test-user-daniel-001', 'Daniel', 'FREE', 'daniel@test.com', NULL, 'テストユーザー Daniel です', '{}', NOW(), NOW()),
  ('test-user-sakura-001', 'Sakura', 'FREE', 'sakura@test.com', NULL, 'テストユーザー Sakura です', '{}', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- パスワード認証情報
-- ログインパスワード（全ユーザー共通）: Test1234!
INSERT INTO "PasswordCredential" ("userId", "hashedPassword", "createdAt", "updatedAt")
VALUES
  ('test-user-helena-001', '$2b$10$/v0yU0NLpEk7tep3BkuWIedxeUksLil3sh6ffw81LmEH.jbdar/Hu', NOW(), NOW()),
  ('test-user-daniel-001', '$2b$10$/v0yU0NLpEk7tep3BkuWIedxeUksLil3sh6ffw81LmEH.jbdar/Hu', NOW(), NOW()),
  ('test-user-sakura-001', '$2b$10$/v0yU0NLpEk7tep3BkuWIedxeUksLil3sh6ffw81LmEH.jbdar/Hu', NOW(), NOW())
ON CONFLICT ("userId") DO NOTHING;

-- AuthSecurityState
INSERT INTO "auth_security_states" ("user_id", "auth_method", "last_login_at", "failed_sign_in_count", "created_at", "updated_at")
VALUES
  ('test-user-helena-001', 'password', NOW(), 0, NOW(), NOW()),
  ('test-user-daniel-001', 'password', NOW(), 0, NOW(), NOW()),
  ('test-user-sakura-001', 'password', NOW(), 0, NOW(), NOW())
ON CONFLICT ("user_id") DO NOTHING;

-- ============================================================
-- 2. コミュニティ（3つ）
-- ============================================================

-- Helena が作成した「週末フットサル」
INSERT INTO "Community" ("id", "name", "description", "logoUrl", "coverUrl", "grade", "createdBy",
  "communityTypeId", "joinMethod", "isPublic", "maxMembers", "mainActivityArea", "activityFrequency", "nearestStation", "targetGender", "ageRange",
  "createdAt", "updatedAt")
VALUES
  ('test-community-futsal-001', '週末フットサル', '毎週末にフットサルを楽しむコミュニティです 🏃‍♂️⚽', NULL, NULL, 'FREE', 'test-user-helena-001',
   'ct-sports', 'FREE_JOIN', true, 30, '代々木公園フットサルコート', '週1回', '代々木', '指定なし', '20代〜40代',
   NOW() - INTERVAL '30 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Daniel が作成した「朝ヨガサークル」
INSERT INTO "Community" ("id", "name", "description", "logoUrl", "coverUrl", "grade", "createdBy",
  "communityTypeId", "joinMethod", "isPublic", "maxMembers", "mainActivityArea", "activityFrequency", "nearestStation", "targetGender", "ageRange",
  "createdAt", "updatedAt")
VALUES
  ('test-community-yoga-001', '朝ヨガサークル', '朝7時から公園でヨガをしています 🧘‍♀️', NULL, NULL, 'FREE', 'test-user-daniel-001',
   'ct-sports', 'APPROVAL', true, 15, '新宿御苑', '週3回', '新宿御苑前', '指定なし', '20代〜50代',
   NOW() - INTERVAL '20 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Sakura が作成した「読書クラブ」
INSERT INTO "Community" ("id", "name", "description", "logoUrl", "coverUrl", "grade", "createdBy",
  "communityTypeId", "joinMethod", "isPublic", "maxMembers", "mainActivityArea", "activityFrequency", "nearestStation", "targetGender", "ageRange",
  "createdAt", "updatedAt")
VALUES
  ('test-community-book-001', '読書クラブ', '月1回の読書会。今月のテーマ本を語り合おう 📚', NULL, NULL, 'FREE', 'test-user-sakura-001',
   'ct-hobby', 'INVITATION', false, NULL, 'オンライン (Zoom)', '月1回', NULL, '指定なし', NULL,
   NOW() - INTERVAL '15 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 2b. コミュニティ — カテゴリ（中間テーブル）
-- ============================================================

INSERT INTO "CommunityCategory" ("id", "communityId", "categoryId")
VALUES
  ('test-cc-futsal-futsal', 'test-community-futsal-001', 'cat-futsal'),
  ('test-cc-yoga-other',    'test-community-yoga-001',   'cat-other'),
  ('test-cc-book-other',    'test-community-book-001',   'cat-other')
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 2c. コミュニティ — 参加レベル（中間テーブル）
-- ============================================================

INSERT INTO "CommunityParticipationLevel" ("id", "communityId", "levelId")
VALUES
  ('test-cpl-futsal-welcome',  'test-community-futsal-001', 'pl-welcome'),
  ('test-cpl-futsal-beginner', 'test-community-futsal-001', 'pl-beginner'),
  ('test-cpl-yoga-welcome',    'test-community-yoga-001',   'pl-welcome'),
  ('test-cpl-yoga-noexp',      'test-community-yoga-001',   'pl-noexp'),
  ('test-cpl-book-welcome',    'test-community-book-001',   'pl-welcome')
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 2d. コミュニティ — 活動曜日（値テーブル）
-- ============================================================

INSERT INTO "CommunityActivityDay" ("id", "communityId", "day")
VALUES
  ('test-cad-futsal-sat', 'test-community-futsal-001', '土'),
  ('test-cad-futsal-sun', 'test-community-futsal-001', '日'),
  ('test-cad-yoga-mon',   'test-community-yoga-001',   '月'),
  ('test-cad-yoga-wed',   'test-community-yoga-001',   '水'),
  ('test-cad-yoga-fri',   'test-community-yoga-001',   '金')
ON CONFLICT ("communityId", "day") DO NOTHING;

-- ============================================================
-- 2e. コミュニティ — タグ（値テーブル）
-- ============================================================

INSERT INTO "CommunityTag" ("id", "communityId", "tag")
VALUES
  ('test-ctag-futsal-1', 'test-community-futsal-001', 'フットサル'),
  ('test-ctag-futsal-2', 'test-community-futsal-001', '週末スポーツ'),
  ('test-ctag-yoga-1',   'test-community-yoga-001',   'ヨガ'),
  ('test-ctag-yoga-2',   'test-community-yoga-001',   '朝活'),
  ('test-ctag-book-1',   'test-community-book-001',   '読書'),
  ('test-ctag-book-2',   'test-community-book-001',   '読書会')
ON CONFLICT ("communityId", "tag") DO NOTHING;

-- ============================================================
-- 3. メンバーシップ（各コミュニティに全員参加）
-- ============================================================

-- 週末フットサル: Helena=OWNER, Daniel=MEMBER, Sakura=MEMBER
INSERT INTO "CommunityMembership" ("id", "communityId", "userId", "role", "joinedAt")
VALUES
  ('test-membership-futsal-helena', 'test-community-futsal-001', 'test-user-helena-001', 'OWNER',  NOW() - INTERVAL '30 days'),
  ('test-membership-futsal-daniel', 'test-community-futsal-001', 'test-user-daniel-001', 'MEMBER', NOW() - INTERVAL '28 days'),
  ('test-membership-futsal-sakura', 'test-community-futsal-001', 'test-user-sakura-001', 'MEMBER', NOW() - INTERVAL '25 days')
ON CONFLICT ("id") DO NOTHING;

-- 朝ヨガサークル: Daniel=OWNER, Helena=ADMIN, Sakura=MEMBER
INSERT INTO "CommunityMembership" ("id", "communityId", "userId", "role", "joinedAt")
VALUES
  ('test-membership-yoga-daniel', 'test-community-yoga-001', 'test-user-daniel-001', 'OWNER',  NOW() - INTERVAL '20 days'),
  ('test-membership-yoga-helena', 'test-community-yoga-001', 'test-user-helena-001', 'ADMIN',  NOW() - INTERVAL '18 days'),
  ('test-membership-yoga-sakura', 'test-community-yoga-001', 'test-user-sakura-001', 'MEMBER', NOW() - INTERVAL '15 days')
ON CONFLICT ("id") DO NOTHING;

-- 読書クラブ: Sakura=OWNER, Helena=MEMBER （Danielは未参加）
INSERT INTO "CommunityMembership" ("id", "communityId", "userId", "role", "joinedAt")
VALUES
  ('test-membership-book-sakura', 'test-community-book-001', 'test-user-sakura-001', 'OWNER',  NOW() - INTERVAL '15 days'),
  ('test-membership-book-helena', 'test-community-book-001', 'test-user-helena-001', 'MEMBER', NOW() - INTERVAL '10 days')
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 4. アクティビティ（各コミュニティに1〜2個）
-- ============================================================

-- 週末フットサル
INSERT INTO "Activity" ("id", "communityId", "title", "description", "defaultLocation", "defaultStartTime", "defaultEndTime", "createdBy", "createdAt", "updatedAt")
VALUES
  ('test-activity-futsal-sat', 'test-community-futsal-001', '土曜フットサル', '毎週土曜の定期フットサル', '代々木公園フットサルコート', '10:00', '12:00', 'test-user-helena-001', NOW() - INTERVAL '28 days', NOW()),
  ('test-activity-futsal-sun', 'test-community-futsal-001', '日曜ミニゲーム', '日曜午後のミニゲーム大会', '駒沢公園', '14:00', '16:00', 'test-user-helena-001', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 朝ヨガサークル
INSERT INTO "Activity" ("id", "communityId", "title", "description", "defaultLocation", "defaultStartTime", "defaultEndTime", "createdBy", "createdAt", "updatedAt")
VALUES
  ('test-activity-yoga-morning', 'test-community-yoga-001', 'モーニングヨガ', '朝の公園でリフレッシュヨガ', '新宿御苑', '07:00', '08:00', 'test-user-daniel-001', NOW() - INTERVAL '18 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 読書クラブ
INSERT INTO "Activity" ("id", "communityId", "title", "description", "defaultLocation", "defaultStartTime", "defaultEndTime", "createdBy", "createdAt", "updatedAt")
VALUES
  ('test-activity-book-monthly', 'test-community-book-001', '月例読書会', '今月のテーマ本についてディスカッション', 'オンライン (Zoom)', '19:00', '21:00', 'test-user-sakura-001', NOW() - INTERVAL '12 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 4-b. スケジュール（各アクティビティの初回日程）
-- ============================================================

INSERT INTO "Schedule" ("id", "activityId", "date", "startTime", "endTime", "location", "status", "capacity", "participationFee", "isOnline", "meetingUrl", "createdAt", "updatedAt")
VALUES
  ('test-sched-futsal-sat-01', 'test-activity-futsal-sat', '2026-03-15', '10:00', '12:00', '代々木公園フットサルコート', 'SCHEDULED', 20, 500,  false, NULL, NOW(), NOW()),
  ('test-sched-futsal-sat-02', 'test-activity-futsal-sat', '2026-03-22', '10:00', '12:00', '代々木公園フットサルコート', 'SCHEDULED', 20, 500,  false, NULL, NOW(), NOW()),
  ('test-sched-futsal-sun-01', 'test-activity-futsal-sun', '2026-03-16', '14:00', '16:00', '駒沢公園', 'SCHEDULED', 16, NULL, false, NULL, NOW(), NOW()),
  ('test-sched-yoga-01',       'test-activity-yoga-morning', '2026-03-10', '07:00', '08:00', '新宿御苑', 'SCHEDULED', NULL, NULL, false, NULL, NOW(), NOW()),
  ('test-sched-yoga-02',       'test-activity-yoga-morning', '2026-03-17', '07:00', '08:00', '新宿御苑', 'SCHEDULED', NULL, NULL, false, NULL, NOW(), NOW()),
  ('test-sched-book-01',       'test-activity-book-monthly', '2026-03-20', '19:00', '21:00', 'オンライン (Zoom)', 'SCHEDULED', 15, NULL, true, 'https://zoom.us/j/1234567890', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 5. アナウンスメント（フィード表示用、時系列をずらす）
-- ============================================================

-- Helena → 週末フットサル: 3件
INSERT INTO "Announcement" ("id", "communityId", "authorId", "title", "content", "createdAt", "updatedAt")
VALUES
  ('test-ann-futsal-001', 'test-community-futsal-001', 'test-user-helena-001',
   '今週末のフットサルについて',
   '今週土曜は雨予報のため、室内コートに変更します。場所は渋谷スポーツセンター B1F です。参加される方は11:00までにお越しください！',
   NOW() - INTERVAL '3 minutes', NOW()),

  ('test-ann-futsal-002', 'test-community-futsal-001', 'test-user-helena-001',
   '新メンバー歓迎！',
   '先週から3名の新しいメンバーが加入しました 🎉 次回の集まりで自己紹介タイムを設けますので、皆さんよろしくお願いします。',
   NOW() - INTERVAL '2 hours', NOW()),

  ('test-ann-futsal-003', 'test-community-futsal-001', 'test-user-helena-001',
   'ユニフォームの件',
   'チームユニフォームのデザイン案を3つ用意しました。来週の練習後に投票を行いますので、楽しみにしていてください！予算は一人3,000円を想定しています。',
   NOW() - INTERVAL '3 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Daniel → 朝ヨガサークル: 3件
INSERT INTO "Announcement" ("id", "communityId", "authorId", "title", "content", "createdAt", "updatedAt")
VALUES
  ('test-ann-yoga-001', 'test-community-yoga-001', 'test-user-daniel-001',
   '明日のヨガは中止です',
   '明日3/4は講師の体調不良のため、モーニングヨガは中止とします。次回は3/6（木）に開催予定です。ご了承ください 🙏',
   NOW() - INTERVAL '30 minutes', NOW()),

  ('test-ann-yoga-002', 'test-community-yoga-001', 'test-user-daniel-001',
   '春の特別レッスン開催',
   '3月21日（春分の日）に特別レッスンを開催します！テーマは「太陽礼拝マスター」。初心者も大歓迎です。参加費は無料、持ち物はヨガマットのみ。',
   NOW() - INTERVAL '1 day', NOW()),

  ('test-ann-yoga-003', 'test-community-yoga-001', 'test-user-helena-001',
   'ヨガマットのおすすめ',
   '最近買い替えたヨガマットがすごく良かったので共有します。Manduka PRO（6mm）です。グリップ力が段違いで、汗をかいても滑りません。Amazonで15%オフやってました！',
   NOW() - INTERVAL '5 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Sakura → 読書クラブ: 2件
INSERT INTO "Announcement" ("id", "communityId", "authorId", "title", "content", "createdAt", "updatedAt")
VALUES
  ('test-ann-book-001', 'test-community-book-001', 'test-user-sakura-001',
   '3月のテーマ本が決まりました',
   '3月のテーマ本は「コンビニ人間」（村田沙耶香）に決定しました📖 読書会は3/22(土) 19:00〜 Zoomで開催します。初参加の方も気軽にどうぞ！',
   NOW() - INTERVAL '4 hours', NOW()),

  ('test-ann-book-002', 'test-community-book-001', 'test-user-sakura-001',
   '2月読書会のまとめ',
   '2月の読書会「推し、燃ゆ」のディスカッションまとめを共有します。「推し活」の意味について深い議論ができました。参加者は8名でした。来月もよろしくお願いします！',
   NOW() - INTERVAL '7 days', NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 6. 既読データ（一部を既読にしておく）
-- ============================================================

-- Helena は自分の投稿は既読扱い + ヨガの最新を既読
INSERT INTO "AnnouncementRead" ("id", "announcementId", "userId", "readAt")
VALUES
  ('test-read-001', 'test-ann-futsal-001', 'test-user-helena-001', NOW()),
  ('test-read-002', 'test-ann-futsal-002', 'test-user-helena-001', NOW()),
  ('test-read-003', 'test-ann-futsal-003', 'test-user-helena-001', NOW()),
  ('test-read-004', 'test-ann-yoga-001',   'test-user-helena-001', NOW())
ON CONFLICT ("announcementId", "userId") DO NOTHING;

-- Daniel はフットサルの最新1件を既読
INSERT INTO "AnnouncementRead" ("id", "announcementId", "userId", "readAt")
VALUES
  ('test-read-005', 'test-ann-futsal-001', 'test-user-daniel-001', NOW()),
  ('test-read-006', 'test-ann-yoga-001',   'test-user-daniel-001', NOW()),
  ('test-read-007', 'test-ann-yoga-002',   'test-user-daniel-001', NOW()),
  ('test-read-008', 'test-ann-yoga-003',   'test-user-daniel-001', NOW())
ON CONFLICT ("announcementId", "userId") DO NOTHING;

-- ============================================================
-- 6b. アナウンスメント — ブックマーク
-- ============================================================

-- Helena はフットサルの最新＋読書会をブックマーク
INSERT INTO "AnnouncementBookmark" ("id", "announcementId", "userId", "createdAt")
VALUES
  ('test-bookmark-001', 'test-ann-futsal-001', 'test-user-helena-001', NOW()),
  ('test-bookmark-002', 'test-ann-book-001',   'test-user-helena-001', NOW())
ON CONFLICT ("announcementId", "userId") DO NOTHING;

-- Daniel はヨガの特別レッスンをブックマーク
INSERT INTO "AnnouncementBookmark" ("id", "announcementId", "userId", "createdAt")
VALUES
  ('test-bookmark-003', 'test-ann-yoga-002', 'test-user-daniel-001', NOW())
ON CONFLICT ("announcementId", "userId") DO NOTHING;

-- ============================================================
-- 7. スケジュール参加データ（メイン日程）
-- ============================================================

-- フットサル土曜 3/15: Helena=参加, Daniel=参加, Sakura=参加
INSERT INTO "Participation" ("id", "scheduleId", "userId", "status", "isVisitor", "respondedAt", "paymentMethod", "paymentStatus")
VALUES
  ('test-part-futsal-sat01-h', 'test-sched-futsal-sat-01', 'test-user-helena-001', 'ATTENDING', false, NOW(), 'PAYPAY', 'CONFIRMED'),
  ('test-part-futsal-sat01-d', 'test-sched-futsal-sat-01', 'test-user-daniel-001', 'ATTENDING', false, NOW(), 'CASH',   'UNPAID'),
  ('test-part-futsal-sat01-s', 'test-sched-futsal-sat-01', 'test-user-sakura-001', 'ATTENDING', false, NOW(), NULL,     NULL)
ON CONFLICT DO NOTHING;

-- フットサル土曜 3/22: Helena=参加
INSERT INTO "Participation" ("id", "scheduleId", "userId", "status", "isVisitor", "respondedAt")
VALUES
  ('test-part-futsal-sat02-h', 'test-sched-futsal-sat-02', 'test-user-helena-001', 'ATTENDING', false, NOW())
ON CONFLICT DO NOTHING;

-- ヨガ 3/10: Daniel=参加, Sakura=参加
INSERT INTO "Participation" ("id", "scheduleId", "userId", "status", "isVisitor", "respondedAt")
VALUES
  ('test-part-yoga01-d', 'test-sched-yoga-01', 'test-user-daniel-001', 'ATTENDING', false, NOW()),
  ('test-part-yoga01-s', 'test-sched-yoga-01', 'test-user-sakura-001', 'ATTENDING', false, NOW())
ON CONFLICT DO NOTHING;

-- 読書会 3/20: Sakura=参加, Helena=参加（オンライン）
INSERT INTO "Participation" ("id", "scheduleId", "userId", "status", "isVisitor", "respondedAt")
VALUES
  ('test-part-book01-s', 'test-sched-book-01', 'test-user-sakura-001', 'ATTENDING', false, NOW()),
  ('test-part-book01-h', 'test-sched-book-01', 'test-user-helena-001', 'ATTENDING', false, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7b. キャンセル待ちデータ
-- ============================================================

-- フットサル日曜 3/16 (capacity=16): Sakura がキャンセル待ち
INSERT INTO "WaitlistEntry" ("id", "scheduleId", "userId", "position", "status", "registeredAt")
VALUES
  ('test-wl-futsal-sun01-s', 'test-sched-futsal-sun-01', 'test-user-sakura-001', 1, 'WAITING', NOW())
ON CONFLICT ("scheduleId", "userId") DO NOTHING;

COMMIT;

-- ========== 9. 統計確認用データ（Phase 4 / UBL-17〜22） ==========
-- Helena が所属する PREMIUM コミュニティにスケジュール＋参加データを追加
-- （テスト用。統計画面で棒グラフ・折れ線グラフの動作確認に使用）

BEGIN;

-- Schedule: フットサル 3月分（統計テスト用）
INSERT INTO "Schedule" ("id", "activityId", "date", "startTime", "endTime", "location", "status", "capacity", "participationFee", "isOnline")
VALUES
  ('test-sched-futsal-0301', 'test-activity-futsal-sat', '2026-03-01', '19:00', '21:00', 'テスト体育館', 'SCHEDULED', 10, 500, false),
  ('test-sched-futsal-0308', 'test-activity-futsal-sat', '2026-03-08', '19:00', '21:00', 'テスト体育館', 'SCHEDULED', 10, 500, false),
  ('test-sched-futsal-0315', 'test-activity-futsal-sat', '2026-03-15', '19:00', '21:00', 'テスト体育館', 'SCHEDULED', 10, 500, false)
ON CONFLICT DO NOTHING;

-- Participation: Helena, Daniel, Sakura の参加
INSERT INTO "Participation" ("id", "scheduleId", "userId", "status", "isVisitor", "respondedAt", "paymentMethod", "paymentStatus")
VALUES
  ('test-part-h-0301', 'test-sched-futsal-0301', 'test-user-helena-001', 'ATTENDING', false, '2026-02-28T10:00:00Z', 'PAYPAY', 'CONFIRMED'),
  ('test-part-d-0301', 'test-sched-futsal-0301', 'test-user-daniel-001', 'ATTENDING', false, '2026-02-28T12:00:00Z', 'CASH', 'UNPAID'),
  ('test-part-s-0301', 'test-sched-futsal-0301', 'test-user-sakura-001', 'CANCELLED', false, '2026-02-28T14:00:00Z', NULL, NULL),
  ('test-part-h-0308', 'test-sched-futsal-0308', 'test-user-helena-001', 'ATTENDING', false, '2026-03-05T10:00:00Z', 'PAYPAY', 'CONFIRMED'),
  ('test-part-d-0308', 'test-sched-futsal-0308', 'test-user-daniel-001', 'ATTENDING', false, '2026-03-05T12:00:00Z', 'CASH', 'CONFIRMED'),
  ('test-part-h-0315', 'test-sched-futsal-0315', 'test-user-helena-001', 'ATTENDING', false, '2026-03-12T10:00:00Z', 'PAYPAY', 'UNPAID'),
  ('test-part-d-0315', 'test-sched-futsal-0315', 'test-user-daniel-001', 'CANCELLED', false, '2026-03-15T08:00:00Z', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Sakura の 0301 キャンセル日時を当日に設定（当日キャンセル検知テスト用）
UPDATE "Participation" SET "cancelledAt" = '2026-03-01T09:00:00Z' WHERE "id" = 'test-part-s-0301';
-- Daniel の 0315 キャンセル日時を当日に設定
UPDATE "Participation" SET "cancelledAt" = '2026-03-15T08:00:00Z' WHERE "id" = 'test-part-d-0315';

COMMIT;

-- ============================================================
-- テストデータ削除用（必要時にコメント解除して実行）
-- ============================================================
-- BEGIN;
-- DELETE FROM "WaitlistEntry" WHERE "id" LIKE 'test-wl-%';
-- DELETE FROM "Participation" WHERE "id" LIKE 'test-part-%';
-- DELETE FROM "Schedule" WHERE "id" LIKE 'test-sched-%';
-- DELETE FROM "AnnouncementBookmark" WHERE "id" LIKE 'test-bookmark-%';
-- DELETE FROM "AnnouncementRead" WHERE "id" LIKE 'test-read-%';
-- DELETE FROM "Announcement" WHERE "id" LIKE 'test-ann-%';
-- DELETE FROM "Activity" WHERE "id" LIKE 'test-activity-%';
-- DELETE FROM "CommunityMembership" WHERE "id" LIKE 'test-membership-%';
-- DELETE FROM "CommunityTag" WHERE "id" LIKE 'test-ctag-%';
-- DELETE FROM "CommunityActivityDay" WHERE "id" LIKE 'test-cad-%';
-- DELETE FROM "CommunityParticipationLevel" WHERE "id" LIKE 'test-cpl-%';
-- DELETE FROM "CommunityCategory" WHERE "id" LIKE 'test-cc-%';
-- DELETE FROM "Community" WHERE "id" LIKE 'test-community-%';
-- DELETE FROM "PasswordCredential" WHERE "userId" LIKE 'test-user-%';
-- DELETE FROM "auth_security_states" WHERE "user_id" LIKE 'test-user-%';
-- DELETE FROM "User" WHERE "id" LIKE 'test-user-%';
-- COMMIT;
