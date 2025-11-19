import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { IntegrationDispatcher } from '@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js'

export class OutboxPublisher {
    constructor(
        private readonly outboxRepository: IOutboxRepository,
        private readonly dispatcher: IntegrationDispatcher
    ) { }

    async publishPending() {
        const pending = await this.outboxRepository.findPending()

        for (const event of pending) {
            try {
                await this.dispatcher.dispatch(event.eventName, event.payload)
                await this.outboxRepository.markAsPublished(event.id)
            } catch (err) {
                console.error('[OutboxPublisher] Error:', err)
                await this.outboxRepository.markAsFailed(event.id)
            }
        }
    }
}


// import { OutboxEvent } from './OutboxEvent.js'
// import { OutboxRepository } from './OutboxRepository.js'

// /**
//  * OutboxPublisher
//  * 
//  * OutboxEventをDBに保存し、後続の送信処理（外部システムやキュー）に渡すための簡易版。
//  * 現時点では「保存 → ログ出力 → 成功/失敗のマーク」だけ行う。
//  */
// export class OutboxPublisher {
//     constructor(private readonly repo: OutboxRepository) { }

//     /**
//      * イベントをOutboxテーブルに登録し、即時publishする
//      */
//     async publish(event: OutboxEvent): Promise<void> {
//         try {
//             // 1️⃣ Outboxテーブルに登録
//             await this.repo.save(event)

//             // 2️⃣ Publish（現段階ではconsole出力）
//             console.log(`[OutboxPublisher] Published event: ${event.eventName}`, {
//                 id: event.id,
//                 aggregateId: event.aggregateId,
//             })

//             // 3️⃣ 成功時にステータス更新
//             await this.repo.markAsPublished(event.id)
//         } catch (error) {
//             console.error(`[OutboxPublisher] Failed to publish event: ${event.id}`, error)
//             await this.repo.markAsFailed(event.id)
//         }
//     }
// }
