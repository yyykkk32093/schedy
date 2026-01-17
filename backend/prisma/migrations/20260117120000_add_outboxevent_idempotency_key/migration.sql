-- Add idempotencyKey to OutboxEvent
-- Safe for existing rows: backfill with id (= outboxEventId), then enforce NOT NULL + UNIQUE.

ALTER TABLE "OutboxEvent" ADD COLUMN "idempotencyKey" TEXT;

UPDATE "OutboxEvent"
SET "idempotencyKey" = "id"
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "OutboxEvent" ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");
