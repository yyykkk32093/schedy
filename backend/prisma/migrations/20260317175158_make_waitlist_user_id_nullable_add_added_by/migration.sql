-- DropIndex
DROP INDEX "WaitlistEntry_scheduleId_userId_key";

-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "addedBy" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "WaitlistEntry_scheduleId_userId_idx" ON "WaitlistEntry"("scheduleId", "userId");

-- WaitlistEntry: userId が NOT NULL の場合のみユニーク制約（部分インデックス）
-- 同じ登録ユーザーが同スケジュールに2回キャンセル待ち登録できないようにする
-- ゲストビジター（userId=NULL）は複数レコードが許容される
CREATE UNIQUE INDEX "WaitlistEntry_scheduleId_userId_unique"
  ON "WaitlistEntry"("scheduleId", "userId")
  WHERE "userId" IS NOT NULL;

-- 既存の synthetic userId (guest-visitor-*) を NULL に変換
UPDATE "WaitlistEntry"
  SET "userId" = NULL
  WHERE "userId" LIKE 'guest-visitor-%';
