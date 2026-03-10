import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import { AnnouncementContent } from '../valueObject/AnnouncementContent.js'
import { AnnouncementId } from '../valueObject/AnnouncementId.js'
import { AnnouncementTitle } from '../valueObject/AnnouncementTitle.js'

/**
 * Announcement: コミュニティ内のお知らせ
 * - OWNER or ADMIN のみ作成可能
 * - 論理削除対応（deletedAt）
 */
export class Announcement extends AggregateRoot {
    private constructor(
        private readonly id: AnnouncementId,
        private readonly communityId: CommunityId,
        private readonly authorId: UserId,
        private title: AnnouncementTitle,
        private content: AnnouncementContent,
        private deletedAt: Date | null,
        private readonly createdAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: AnnouncementId
        communityId: CommunityId
        authorId: UserId
        title: AnnouncementTitle
        content: AnnouncementContent
    }): Announcement {
        return new Announcement(
            params.id,
            params.communityId,
            params.authorId,
            params.title,
            params.content,
            null,
            new Date(),
        )
    }

    static reconstruct(params: {
        id: AnnouncementId
        communityId: CommunityId
        authorId: UserId
        title: AnnouncementTitle
        content: AnnouncementContent
        deletedAt: Date | null
        createdAt: Date
    }): Announcement {
        return new Announcement(
            params.id,
            params.communityId,
            params.authorId,
            params.title,
            params.content,
            params.deletedAt,
            params.createdAt,
        )
    }

    softDelete(): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('すでに削除済みです', 'ANNOUNCEMENT_ALREADY_DELETED')
        }
        this.deletedAt = new Date()
    }

    isDeleted(): boolean {
        return this.deletedAt !== null
    }

    getId(): AnnouncementId { return this.id }
    getCommunityId(): CommunityId { return this.communityId }
    getAuthorId(): UserId { return this.authorId }
    getTitle(): AnnouncementTitle { return this.title }
    getContent(): AnnouncementContent { return this.content }
    getDeletedAt(): Date | null { return this.deletedAt }
    getCreatedAt(): Date { return this.createdAt }
}
