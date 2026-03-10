import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import { PollId } from '../valueObject/PollId.js'
import { PollQuestion } from '../valueObject/PollQuestion.js'
import type { PollOption } from './PollOption.js'

/**
 * Poll: 投票/アンケート集約ルート
 * - OWNER or ADMIN のみ作成可能
 * - アナウンスに紐づく投票（announcementId あり）とコミュニティ直接の投票（なし）の両方をサポート
 * - 論理削除対応（deletedAt）
 */
export class Poll extends AggregateRoot {
    private constructor(
        private readonly id: PollId,
        private readonly communityId: CommunityId,
        private readonly announcementId: string | null,
        private readonly question: PollQuestion,
        private readonly isMultipleChoice: boolean,
        private readonly deadline: Date | null,
        private readonly createdBy: UserId,
        private deletedAt: Date | null,
        private readonly createdAt: Date,
        private readonly options: PollOption[],
    ) {
        super()
    }

    static create(params: {
        id: PollId
        communityId: CommunityId
        announcementId: string | null
        question: PollQuestion
        isMultipleChoice: boolean
        deadline: Date | null
        createdBy: UserId
        options: PollOption[]
    }): Poll {
        if (params.options.length < 2) {
            throw new DomainValidationError('選択肢は2つ以上必要です', 'POLL_OPTIONS_TOO_FEW')
        }
        if (params.options.length > 20) {
            throw new DomainValidationError('選択肢は20個以内にしてください', 'POLL_OPTIONS_TOO_MANY')
        }
        return new Poll(
            params.id,
            params.communityId,
            params.announcementId,
            params.question,
            params.isMultipleChoice,
            params.deadline,
            params.createdBy,
            null,
            new Date(),
            params.options,
        )
    }

    static reconstruct(params: {
        id: PollId
        communityId: CommunityId
        announcementId: string | null
        question: PollQuestion
        isMultipleChoice: boolean
        deadline: Date | null
        createdBy: UserId
        deletedAt: Date | null
        createdAt: Date
        options: PollOption[]
    }): Poll {
        return new Poll(
            params.id,
            params.communityId,
            params.announcementId,
            params.question,
            params.isMultipleChoice,
            params.deadline,
            params.createdBy,
            params.deletedAt,
            params.createdAt,
            params.options,
        )
    }

    softDelete(): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('すでに削除済みです', 'POLL_ALREADY_DELETED')
        }
        this.deletedAt = new Date()
    }

    isExpired(): boolean {
        if (!this.deadline) return false
        return new Date() > this.deadline
    }

    isDeleted(): boolean {
        return this.deletedAt !== null
    }

    getId(): PollId { return this.id }
    getCommunityId(): CommunityId { return this.communityId }
    getAnnouncementId(): string | null { return this.announcementId }
    getQuestion(): PollQuestion { return this.question }
    getIsMultipleChoice(): boolean { return this.isMultipleChoice }
    getDeadline(): Date | null { return this.deadline }
    getCreatedBy(): UserId { return this.createdBy }
    getDeletedAt(): Date | null { return this.deletedAt }
    getCreatedAt(): Date { return this.createdAt }
    getOptions(): PollOption[] { return this.options }
}
