// src/domains/sharedDomains/domain/event/DomainEventBus.ts
import { BaseDomainEvent } from './BaseDomainEvent.js'
import { DomainEventPublisher } from './DomainEventPublisher.js'
import { DomainEventSubscriber } from './DomainEventSubscriber.js'

/**
 * ドメインイベントを発行・購読するためのバス。
 * ジェネリクス T でイベント型を限定できる。
 */
export class DomainEventBus<
    TEvent extends BaseDomainEvent = BaseDomainEvent
> implements DomainEventPublisher {
    private subscribers: DomainEventSubscriber<TEvent>[] = []

    subscribe(subscriber: DomainEventSubscriber<TEvent>) {
        this.subscribers.push(subscriber)
    }

    async publish(event: TEvent) {
        const eventName = event.eventName

        const hits = this.subscribers.filter((s) => {
            const subscribed = s.subscribedTo()

            if (Array.isArray(subscribed)) {
                return subscribed.includes(eventName)
            }
            return subscribed === eventName
        })

        for (const s of hits) {
            await s.handle(event)
        }
    }

    async publishAll(events: TEvent[]): Promise<void> {
        for (const e of events) {
            await this.publish(e)
        }
    }
}


// // src/sharedDomains/domain/event/DomainEventBus.ts
// import { BaseDomainEvent } from './BaseDomainEvent.js'
// import { DomainEventSubscriber } from './DomainEventSubscriber.js'

// /**
//  * DomainEventBus
//  * - DomainEventPublisher の実装として、メモリ内Pub/Subを行う。
//  * - Subscriberを登録し、イベント発火時に呼び出す。
//  */
// export class DomainEventBus {
//     private subscribers: Map<string, DomainEventSubscriber<BaseDomainEvent>[]> = new Map()

//     /**
//      * イベント購読者を登録する
//      */
//     subscribe<T extends BaseDomainEvent>(subscriber: DomainEventSubscriber<T>): void {
//         const eventName = subscriber.eventName()
//         const list = this.subscribers.get(eventName) ?? []
//         list.push(subscriber as DomainEventSubscriber<BaseDomainEvent>)
//         this.subscribers.set(eventName, list)
//     }

//     /**
//      * イベントを発行する（購読者に通知）
//      */
//     async publish<T extends BaseDomainEvent>(event: T): Promise<void> {
//         const eventName = event.eventName
//         const list = this.subscribers.get(eventName) ?? []

//         for (const subscriber of list) {
//             await subscriber.handle(event)
//         }
//     }

//     /**
//      * 複数イベントを順次発行する
//      */
//     async publishAll(events: BaseDomainEvent[]): Promise<void> {
//         for (const event of events) {
//             await this.publish(event)
//         }
//     }
// }
