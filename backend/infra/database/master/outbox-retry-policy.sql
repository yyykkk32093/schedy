INSERT INTO "OutboxRetryPolicy" (
    "routingKey",
    "maxRetries",
    "baseInterval",
    "maxInterval",
    "createdAt",
    "updatedAt"
) VALUES (
    'audit.log',   -- routing key
    5,             -- 最大リトライ回数
    3000,          -- 基本の retryInterval(3s)
    60000,         -- 最大インターバル(60s)
    NOW(),
    NOW()
)
ON CONFLICT ("routingKey") DO UPDATE SET
    "maxRetries" = EXCLUDED."maxRetries",
    "baseInterval" = EXCLUDED."baseInterval",
    "maxInterval" = EXCLUDED."maxInterval",
    "updatedAt" = NOW();
