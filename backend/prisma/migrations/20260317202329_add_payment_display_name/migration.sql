-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "displayName" VARCHAR(100);

-- Backfill: 登録ユーザーの Payment に User.displayName をスナップショット
UPDATE "Payment" p
SET "displayName" = u."displayName"
FROM "User" u
WHERE p."userId" = u."id"
  AND p."displayName" IS NULL;

-- Backfill: 未登録ビジターの Payment に Participation.visitorName をスナップショット
UPDATE "Payment" p
SET "displayName" = part."visitorName"
FROM "Participation" part
WHERE p."participationId" = part."id"
  AND part."isVisitor" = true
  AND part."visitorName" IS NOT NULL
  AND p."displayName" IS NULL;
