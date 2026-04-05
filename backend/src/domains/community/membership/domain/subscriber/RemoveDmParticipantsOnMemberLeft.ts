import type { TransactionalDomainEventSubscriber } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventSubscriber.js'
import { MemberLeftEvent } from '@/domains/community/membership/domain/event/MemberLeftEvent.js'

/**
 * RemoveDmParticipantsOnMemberLeft
 *
 * コミュニティ退出時に、そのコミュニティ配下のアクティビティチャンネルの
 * DM参加(DMParticipant)を削除する処理は不要（DMはコミュニティに紐づかない）。
 *
 * 本Subscriberは将来拡張用の骨格として残す。
 * 現時点ではDMはコミュニティとは独立しているため、何も行わない。
 *
 * NOTE: 将来、コミュニティ連動DM（グループDM等）が実装された場合に拡張する。
 */
export class RemoveDmParticipantsOnMemberLeft
    implements TransactionalDomainEventSubscriber<MemberLeftEvent> {

    subscribedTo(): string {
        return MemberLeftEvent.EVENT_NAME
    }

    async handle(
        _event: MemberLeftEvent,
        _repos: any,
    ): Promise<void> {
        // 現時点ではDMはコミュニティに紐づかないため、何もしない
        // 将来拡張時にここにDMParticipant削除ロジックを追加
    }
}
