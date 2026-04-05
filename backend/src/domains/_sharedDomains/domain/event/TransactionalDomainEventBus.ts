// src/domains/_sharedDomains/domain/event/TransactionalDomainEventBus.ts

import { BaseDomainEvent } from './BaseDomainEvent.js'
import { TransactionalDomainEventSubscriber } from './TransactionalDomainEventSubscriber.js'

/**
 * トランザクション内ドメインイベントバス。
 *
 * 通常の DomainEventBus（TX commit 後）とは別系統で、
 * TX 内で同期的にイベントを配信し、Subscriber に TX-scope リポジトリを渡す。
 *
 * publish(event, repos) の repos は PrismaUnitOfWork 内で
 * TX-scope リポジトリとしてバインドされたオブジェクトが渡される。
 *
 * 【DomainEventBus との使い分け】
 * - DomainEventBus       : TX commit 後のベストエフォート副作用（ログ、通知等）
 * - TransactionalEventBus: TX 内のアトミック副作用（連鎖削除、Payment 自動作成等）
 */
export class TransactionalDomainEventBus {
    private subscribers: TransactionalDomainEventSubscriber[] = []

    subscribe(subscriber: TransactionalDomainEventSubscriber): void {
        this.subscribers.push(subscriber)
    }

    async publish(event: BaseDomainEvent, repos: any): Promise<void> {
        const eventName = event.eventName

        const hits = this.subscribers.filter((s) => {
            const subscribed = s.subscribedTo()

            if (Array.isArray(subscribed)) {
                return subscribed.includes(eventName)
            }
            return subscribed === eventName
        })

        for (const s of hits) {
            await s.handle(event, repos)
        }
    }

    async publishAll(events: BaseDomainEvent[], repos: any): Promise<void> {
        for (const e of events) {
            await this.publish(e, repos)
        }
    }
}
