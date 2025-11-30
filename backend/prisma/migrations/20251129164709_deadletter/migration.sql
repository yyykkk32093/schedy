-- CreateTable
CREATE TABLE "OutboxDeadLetter" (
    "id" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "routingKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxDeadLetter_pkey" PRIMARY KEY ("id")
);
