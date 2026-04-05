/**
 * INotificationRepository
 *
 * Notification テーブルへの CRUD を抽象化するリポジトリインターフェース。
 * tx-scope で注入されるため、UoW 内のトランザクションに参加する。
 */
export interface NotificationCreateInput {
    id: string
    userId: string
    type: string
    title: string
    body?: string | null
    referenceId?: string | null
    referenceType?: string | null
    /** 構造化メタデータ（通知種別ごとに異なる JSON） */
    metadata?: Record<string, unknown> | null
}

export interface INotificationRepository {
    create(input: NotificationCreateInput): Promise<void>
}
