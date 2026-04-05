import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'

/**
 * WaitlistPromotedEvent — キャンセル待ちから繰り上がった時のドメインイベント
 *
 * D-P2-7: 繰り上げ時に Payment を自動作成するためのトリガー
 */
export class WaitlistPromotedEvent extends BaseDomainEvent {
    static readonly EVENT_NAME = 'waitlist.promoted'

    constructor(
        public readonly scheduleId: string,
        public readonly promotedUserId: string,
        public readonly participationId: string,
        public readonly isVisitor: boolean,
        public readonly displayName: string | null = null,
    ) {
        super(WaitlistPromotedEvent.EVENT_NAME, scheduleId)
    }
}
