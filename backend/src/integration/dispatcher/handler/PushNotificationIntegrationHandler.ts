import { AppSecretsLoader } from '@/_sharedTech/config/AppSecretsLoader.js';
import { prisma } from '@/_sharedTech/db/client.js';
import { logger } from '@/_sharedTech/logger/logger.js';
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js';
import { IntegrationHandler } from './IntegrationHandler.js';

/**
 * PushNotificationIntegrationHandler
 *
 * OutboxWorker から routingKey = 'notification.push' で dispatch されるハンドラ。
 * 対象ユーザーの全 DeviceToken を取得し、firebase-admin で FCM 送信する。
 *
 * firebase-admin が未設定（GOOGLE_APPLICATION_CREDENTIALS なし）の場合は
 * ログ出力のみで skip する（ローカル開発時を想定）。
 */
export class PushNotificationIntegrationHandler extends IntegrationHandler {

    async handle(event: OutboxEvent): Promise<void> {
        const payload = event.payload as {
            notificationId: string;
            targetUserId: string;
            type: string;
            title: string;
            body: string | null;
            referenceId: string | null;
            referenceType: string | null;
        };

        const { targetUserId, title, body, type, referenceId, referenceType } = payload;

        // 対象ユーザーの全デバイストークンを取得
        const deviceTokens = await prisma.deviceToken.findMany({
            where: { userId: targetUserId },
            select: { token: true },
        });

        if (deviceTokens.length === 0) {
            logger.info(
                { eventId: event.outboxEventId, userId: targetUserId },
                '[FCM] No device tokens found — skipping push',
            );
            return;
        }

        // firebase-admin の遅延ロード（未インストール時にクラッシュしないよう）
        let messaging: FirebaseMessaging | null = null;
        try {
            messaging = await getFirebaseMessaging();
        } catch (err) {
            logger.warn(
                { err },
                '[FCM] firebase-admin not available — skipping push notification',
            );
            return;
        }

        if (!messaging) return;

        const tokens = deviceTokens.map((d: { token: string }) => d.token);
        const fcmPayload = {
            notification: {
                title,
                body: body ?? undefined,
            },
            data: {
                type,
                ...(referenceId ? { referenceId } : {}),
                ...(referenceType ? { referenceType } : {}),
            },
        };

        try {
            // FCM sendEachForMulticast は 500 トークン/回の制限があるためバッチ分割
            const BATCH_SIZE = 500;
            let totalSuccess = 0;
            let totalFailure = 0;
            const allInvalidTokens: string[] = [];

            for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                const batch = tokens.slice(i, i + BATCH_SIZE);
                const response = await messaging.sendEachForMulticast({
                    tokens: batch,
                    ...fcmPayload,
                });

                totalSuccess += response.successCount;
                totalFailure += response.failureCount;

                // 無効なトークンを収集
                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success && isInvalidTokenError(resp.error)) {
                            allInvalidTokens.push(batch[idx]);
                        }
                    });
                }
            }

            logger.info(
                {
                    eventId: event.outboxEventId,
                    userId: targetUserId,
                    successCount: totalSuccess,
                    failureCount: totalFailure,
                    batchCount: Math.ceil(tokens.length / BATCH_SIZE),
                },
                '[FCM] Push notification sent',
            );

            // 無効なトークンをクリーンアップ
            if (allInvalidTokens.length > 0) {
                await prisma.deviceToken.deleteMany({
                    where: { token: { in: allInvalidTokens } },
                });
                logger.info(
                    { count: allInvalidTokens.length },
                    '[FCM] Cleaned up invalid device tokens',
                );
            }
        } catch (err) {
            logger.error(
                { err, eventId: event.outboxEventId, userId: targetUserId },
                '[FCM] Failed to send push notification',
            );
            throw err; // リトライ対象にする
        }
    }
}

// ─── Firebase Admin 遅延初期化 ──────────────────────────

type FirebaseMessaging = import('firebase-admin').messaging.Messaging;

let cachedMessaging: FirebaseMessaging | null = null;

async function getFirebaseMessaging(): Promise<FirebaseMessaging | null> {
    if (cachedMessaging) return cachedMessaging;

    // firebase-admin がインストールされていない場合は null を返す
    try {
        const admin = await import('firebase-admin');

        // 既に初期化済みかチェック
        if (admin.apps.length === 0) {
            // AppSecretsLoader 経由で FCM サービスアカウントJSON を取得
            const fcmConfig = AppSecretsLoader.getFcm();
            const serviceAccountJson = fcmConfig.serviceAccountJson;
            if (serviceAccountJson) {
                const serviceAccount = JSON.parse(serviceAccountJson);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                // フォールバック: デフォルトの認証情報を使用
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                });
            } else {
                logger.warn('[FCM] No Firebase credentials configured — push notifications disabled');
                return null;
            }
        }

        cachedMessaging = admin.messaging();
        return cachedMessaging;
    } catch {
        return null;
    }
}

/** FCM のトークン無効エラーかどうか判定 */
function isInvalidTokenError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    return code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered';
}
