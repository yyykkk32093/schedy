/**
 * Worker 向け NotificationService ヘルパー
 *
 * Worker プロセスは Socket.io を持たないため、NoopRealtimeEmitter を使用する。
 * $transaction 内で prepareNotification() を呼び、commit 後に flush() する。
 */
import { NoopRealtimeEmitter } from '@/application/_sharedApplication/notification/NoopRealtimeEmitter.js'
import { NotificationRepositoryImpl } from '@/application/_sharedApplication/notification/NotificationRepositoryImpl.js'
import type { NotificationInput } from '@/application/_sharedApplication/notification/NotificationService.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'
import type { Prisma, PrismaClient } from '@prisma/client'

/**
 * Worker 用 NotificationService のシングルトン
 */
let _workerNotificationService: NotificationService | null = null

export function getWorkerNotificationService(): NotificationService {
    if (!_workerNotificationService) {
        _workerNotificationService = new NotificationService(new NoopRealtimeEmitter())
    }
    return _workerNotificationService
}

/**
 * Worker のトランザクション内で通知を作成するヘルパー
 *
 * @param tx Prisma トランザクションクライアント
 * @param input 通知データ
 * @param service NotificationService インスタンス
 * @returns notification ID
 */
export async function createNotificationInTx(
    tx: Prisma.TransactionClient,
    input: NotificationInput,
    service: NotificationService,
): Promise<string> {
    const repos = {
        notification: new NotificationRepositoryImpl(tx),
        outbox: new OutboxRepository(tx),
    }
    return service.prepareNotification(repos, input)
}

/**
 * Worker で DB 直接通知（TX 不要の場合）
 *
 * prisma.$transaction を内部で生成して通知を作成する。
 */
export async function sendWorkerNotification(
    prisma: PrismaClient,
    input: NotificationInput,
): Promise<void> {
    const service = getWorkerNotificationService()
    await prisma.$transaction(async (tx) => {
        await createNotificationInTx(tx, input, service)
    })
    service.flush() // NoopRealtimeEmitter なので実質何もしないが、バッファはクリアされる
}
