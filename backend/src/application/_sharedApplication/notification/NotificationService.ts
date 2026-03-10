/**
 * NotificationService
 *
 * 通知の「① DB INSERT + ② OutboxEvent INSERT（同一 TX）→ TX 後に ③ WS emit」を一元化する共通サービス。
 *
 * 使い方:
 *   - UseCase のトランザクション内で `prepareNotification()` を呼ぶ（①② を実行）
 *   - TX commit 後に `flush()` を呼ぶ（③ WS 配信を fire-and-forget で実行）
 *
 * ※ TX 内で WS emit してはいけない（TX ロールバック時に取り消せないため）。
 *   prepare → commit → flush の順序を守ること。
 */

import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { randomUUID } from 'crypto'
import type { INotificationRepository } from './INotificationRepository.js'
import type { IRealtimeEmitter } from './IRealtimeEmitter.js'

// ============================================================
// 入力型
// ============================================================

export interface NotificationInput {
    /** 通知先ユーザー ID */
    userId: string
    /** 通知種別（e.g. 'WAITLIST_PROMOTED', 'SCHEDULE_CANCELLED'） */
    type: string
    /** 通知タイトル */
    title: string
    /** 通知本文（任意） */
    body?: string | null
    /** 関連エンティティ ID（任意） */
    referenceId?: string | null
    /** 関連エンティティ種別（e.g. 'SCHEDULE', 'ANNOUNCEMENT'）（任意） */
    referenceType?: string | null
}

// ============================================================
// TX 内で使うリポジトリ群の型
// ============================================================

export interface NotificationTxRepositories {
    notification: INotificationRepository
    outbox: IOutboxRepository
}

// ============================================================
// 内部: flush 用バッファ
// ============================================================

interface PendingEmit {
    userId: string
    payload: {
        id: string
        type: string
        title: string
        body: string | null
        referenceId: string | null
        referenceType: string | null
        isRead: boolean
        createdAt: string
    }
}

// ============================================================
// NotificationService
// ============================================================

export class NotificationService {
    /** TX commit 後に WS 配信するためのバッファ */
    private pendingEmits: PendingEmit[] = []

    constructor(
        private readonly emitter: IRealtimeEmitter,
    ) { }

    /**
     * TX 内で呼ぶ: ① Notification INSERT + ② OutboxEvent INSERT
     *
     * @param repos  tx-scope のリポジトリ群（UoW 内で生成されたもの）
     * @param input  通知データ
     */
    async prepareNotification(
        repos: NotificationTxRepositories,
        input: NotificationInput,
    ): Promise<string> {
        const notificationId = randomUUID()
        const now = new Date()

        // ① Notification INSERT
        await repos.notification.create({
            id: notificationId,
            userId: input.userId,
            type: input.type,
            title: input.title,
            body: input.body ?? null,
            referenceId: input.referenceId ?? null,
            referenceType: input.referenceType ?? null,
        })

        // ② OutboxEvent INSERT（FCM 送信用）
        const outboxEvent = new OutboxEvent({
            outboxEventId: randomUUID(),
            idempotencyKey: `notification:${notificationId}`,
            aggregateId: input.userId,
            eventName: 'NotificationCreated',
            eventType: `notification.${input.type.toLowerCase()}`,
            routingKey: 'notification.push',
            payload: {
                notificationId,
                targetUserId: input.userId,
                type: input.type,
                title: input.title,
                body: input.body ?? null,
                referenceId: input.referenceId ?? null,
                referenceType: input.referenceType ?? null,
            },
            occurredAt: now,
        })
        await repos.outbox.save(outboxEvent)

        // ③ 用バッファに追加（TX 後に flush で配信）
        this.pendingEmits.push({
            userId: input.userId,
            payload: {
                id: notificationId,
                type: input.type,
                title: input.title,
                body: input.body ?? null,
                referenceId: input.referenceId ?? null,
                referenceType: input.referenceType ?? null,
                isRead: false,
                createdAt: now.toISOString(),
            },
        })

        return notificationId
    }

    /**
     * TX commit 後に呼ぶ: ③ WS 配信（fire-and-forget）
     * バッファをクリアしつつ、溜まった通知を全て配信する。
     */
    flush(): void {
        const emits = this.pendingEmits.splice(0)
        for (const { userId, payload } of emits) {
            this.emitter.emitToUser(userId, 'notification:new', payload)
        }
    }

    /**
     * バッファをクリアする（エラー時のリセット用）
     */
    clear(): void {
        this.pendingEmits.splice(0)
    }
}
