// backend/test/domains/sharedDomains/domain/event/DomainEventBus.test.ts
import { BaseDomainEvent } from '@/domains/sharedDomains/domain/event/BaseDomainEvent.js'
import { DomainEventBus } from '@/domains/sharedDomains/domain/event/DomainEventBus.js'
import { DomainEventSubscriber } from '@/domains/sharedDomains/domain/event/DomainEventSubscriber.js'
import { describe, expect, it, vi } from 'vitest'

/**
 * テスト用のイベント（BaseDomainEventを継承）
 */
class TestEvent extends BaseDomainEvent {
    constructor(aggregateId?: string) {
        super('TestEvent', aggregateId)
    }
}

/**
 * テスト用の購読者
 */
class TestSubscriber implements DomainEventSubscriber<TestEvent> {
    public handle = vi.fn()

    eventName(): string {
        return 'TestEvent'
    }
}

describe('DomainEventBus', () => {
    it('購読者がイベントを受け取る', async () => {
        // Arrange
        const bus = new DomainEventBus()
        const subscriber = new TestSubscriber()
        bus.subscribe(subscriber)

        const event = new TestEvent('user-123')

        // Act
        await bus.publish(event)

        // Assert
        expect(subscriber.handle).toHaveBeenCalledTimes(1)
        expect(subscriber.handle).toHaveBeenCalledWith(event)
    })

    it('publishAllで複数イベントを発行できる', async () => {
        const bus = new DomainEventBus()
        const subscriber = new TestSubscriber()
        bus.subscribe(subscriber)

        const event1 = new TestEvent()
        const event2 = new TestEvent()

        await bus.publishAll([event1, event2])

        expect(subscriber.handle).toHaveBeenCalledTimes(2)
    })
})
