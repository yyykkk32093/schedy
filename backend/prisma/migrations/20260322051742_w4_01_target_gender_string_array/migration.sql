-- W4-01: targetGender を String? から String[] に変換（データ保全）
-- 1. 新しい配列カラムを追加
ALTER TABLE "Community" ADD COLUMN "targetGender_new" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. 既存データを変換: 非NULLの単一値を配列に変換
UPDATE "Community"
SET "targetGender_new" = ARRAY["targetGender"]
WHERE "targetGender" IS NOT NULL AND "targetGender" != '';

-- 3. 旧カラムを削除
ALTER TABLE "Community" DROP COLUMN "targetGender";

-- 4. 新カラムをリネーム
ALTER TABLE "Community" RENAME COLUMN "targetGender_new" TO "targetGender";

-- 5. デフォルト値を設定
ALTER TABLE "Community" ALTER COLUMN "targetGender" SET DEFAULT ARRAY[]::TEXT[];
