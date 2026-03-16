-- Participation: userId が NOT NULL の場合のみユニーク制約（同じユーザーが同スケジュールに2回参加できない）
-- PostgreSQL の部分ユニークインデックス（Prisma では直接表現不可）
CREATE UNIQUE INDEX "Participation_scheduleId_userId_unique"
  ON "Participation"("scheduleId", "userId")
  WHERE "userId" IS NOT NULL;

-- 既存 Payment に participationId をバックフィル
UPDATE "Payment" p
SET "participationId" = (
  SELECT par.id
  FROM "Participation" par
  WHERE par."scheduleId" = p."scheduleId"
    AND par."userId" = p."userId"
  LIMIT 1
)
WHERE p."participationId" IS NULL
  AND p."userId" IS NOT NULL;