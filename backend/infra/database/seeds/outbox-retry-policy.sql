-- notification.push: FCM プッシュ通知
INSERT INTO outbox.outbox_retry_policies (
    "routing_key",
    "max_retries",
    "base_interval",
    "max_interval",
    "created_at",
    "updated_at"
) VALUES (
    'notification.push',   -- routing key
    5,             -- 最大リトライ回数
    3000,          -- 基本の retryInterval(3s)
    60000,         -- 最大インターバル(60s)
    NOW(),
    NOW()
)
ON CONFLICT ("routing_key") DO UPDATE SET
    "max_retries" = EXCLUDED."max_retries",
    "base_interval" = EXCLUDED."base_interval",
    "max_interval" = EXCLUDED."max_interval",
    "updated_at" = NOW();


-- UBL-29: LINE Webhook
INSERT INTO outbox.outbox_retry_policies (
    "routing_key",
    "max_retries",
    "base_interval",
    "max_interval",
    "created_at",
    "updated_at"
) VALUES (
    'webhook.line',
    3,             -- 最大リトライ回数（外部API向けは控えめに）
    5000,          -- 基本の retryInterval(5s)
    30000,         -- 最大インターバル(30s)
    NOW(),
    NOW()
)
ON CONFLICT ("routing_key") DO UPDATE SET
    "max_retries" = EXCLUDED."max_retries",
    "base_interval" = EXCLUDED."base_interval",
    "max_interval" = EXCLUDED."max_interval",
    "updated_at" = NOW();
