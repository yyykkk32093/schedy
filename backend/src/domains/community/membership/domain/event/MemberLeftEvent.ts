import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'

/**
 * MemberLeftEvent — メンバーがコミュニティを脱退した時のドメインイベント
 *
 * TX内ドメインイベントとして発行され、以下の連鎖処理をアトミックに実行:
 * - 将来参加(Participation)のキャンセル
 * - キャンセル待ち(WaitlistEntry)の削除
 * - DM参加(DMParticipant)の削除
 */
export class MemberLeftEvent extends BaseDomainEvent {
    static readonly EVENT_NAME = 'community.member.left'

    constructor(
        public readonly communityId: string,
        public readonly userId: string,
    ) {
        super(MemberLeftEvent.EVENT_NAME, communityId)
    }
}
