-- notification.push: FCM プッシュ通知
INSERT INTO "OutboxRetryPolicy" (
    "routingKey",
    "maxRetries",
    "baseInterval",
    "maxInterval",
    "createdAt",
    "updatedAt"
) VALUES (
    'notification.push',   -- routing key
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


-- UBL-29: LINE Webhook
INSERT INTO "OutboxRetryPolicy" (
    "routingKey",
    "maxRetries",
    "baseInterval",
    "maxInterval",
    "createdAt",
    "updatedAt"
) VALUES (
    'webhook.line',
    3,             -- 最大リトライ回数（外部API向けは控えめに）
    5000,          -- 基本の retryInterval(5s)
    30000,         -- 最大インターバル(30s)
    NOW(),
    NOW()
)
ON CONFLICT ("routingKey") DO UPDATE SET
    "maxRetries" = EXCLUDED."maxRetries",
    "baseInterval" = EXCLUDED."baseInterval",
    "maxInterval" = EXCLUDED."maxInterval",
    "updatedAt" = NOW();
