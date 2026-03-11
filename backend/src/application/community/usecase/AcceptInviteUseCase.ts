import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityAuditLog } from '@/domains/community/auditLog/domain/model/entity/CommunityAuditLog.js'
import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { IInviteTokenRepository } from '@/domains/community/invite/domain/repository/IInviteTokenRepository.js'
import { CommunityMembership } from '@/domains/community/membership/domain/model/entity/CommunityMembership.js'
import { MembershipId } from '@/domains/community/membership/domain/model/valueObject/MembershipId.js'
import { MembershipRole } from '@/domains/community/membership/domain/model/valueObject/MembershipRole.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'

export type AcceptInviteTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    inviteToken: IInviteTokenRepository
    auditLog: ICommunityAuditLogRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

/**
 * AcceptInviteUseCase — 招待トークンでコミュニティ参加（UBL-11）
 */
export class AcceptInviteUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<AcceptInviteTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: {
        token: string
        userId: string
    }): Promise<{ communityId: string; membershipId: string }> {
        let communityIdStr = ''
        let membershipIdStr = ''

        await this.unitOfWork.run(async (repos) => {
            // トークン検証
            const invite = await repos.inviteToken.findByToken(input.token)
            if (!invite) {
                throw new HttpError({ statusCode: 404, code: 'INVITE_NOT_FOUND', message: '招待リンクが見つかりません' })
            }
            if (invite.usedAt) {
                throw new HttpError({ statusCode: 409, code: 'INVITE_ALREADY_USED', message: 'この招待リンクは既に使用されています' })
            }
            if (invite.expiresAt < new Date()) {
                throw new HttpError({ statusCode: 410, code: 'INVITE_EXPIRED', message: '招待リンクの有効期限が切れています' })
            }

            const communityId = invite.communityId

            // コミュニティ存在確認
            const community = await repos.community.findById(communityId)
            if (!community || community.getDeletedAt()) {
                throw new CommunityNotFoundError()
            }

            // 既に参加済みチェック
            const existing = await repos.membership.findByCommunityAndUser(communityId, input.userId)
            if (existing && !existing.getLeftAt()) {
                throw new HttpError({ statusCode: 409, code: 'ALREADY_MEMBER', message: '既にこのコミュニティのメンバーです' })
            }

            // 上限人数チェック
            const maxMembers = community.getMaxMembers()
            if (maxMembers) {
                const members = await repos.membership.findsByCommunityId(communityId)
                const activeCount = members.filter((m) => !m.getLeftAt()).length
                if (activeCount >= maxMembers) {
                    throw new HttpError({ statusCode: 409, code: 'COMMUNITY_FULL', message: 'コミュニティの上限人数に達しています' })
                }
            }

            // メンバーシップ作成
            const membershipId = MembershipId.create(this.idGenerator.generate())
            const membership = CommunityMembership.create({
                id: membershipId,
                communityId: CommunityId.create(communityId),
                userId: UserId.create(input.userId),
                role: MembershipRole.member(),
            })
            await repos.membership.save(membership)

            // トークンを使用済みにマーク
            await repos.inviteToken.markUsed(input.token, input.userId)

            // 監査ログ
            await repos.auditLog.save(new CommunityAuditLog({
                communityId,
                actorUserId: input.userId,
                action: 'MEMBER_JOINED_VIA_INVITE',
                summary: `招待リンクでコミュニティに参加しました`,
            }))

            // OWNER/ADMIN に INVITE_ACCEPTED 通知
            const allMembers = await repos.membership.findsByCommunityId(communityId)
            const admins = allMembers.filter(
                (m) => m.isActive() && m.getRole().canManageMembers() && m.getUserId().getValue() !== input.userId,
            )
            const communityName = community.getName().getValue()
            for (const admin of admins) {
                await this.notificationService.prepareNotification(repos, {
                    userId: admin.getUserId().getValue(),
                    type: 'INVITE_ACCEPTED',
                    title: '招待リンクで新メンバーが参加しました',
                    body: `${communityName} に新しいメンバーが参加しました`,
                    referenceId: communityId,
                    referenceType: 'COMMUNITY',
                })
            }

            communityIdStr = communityId
            membershipIdStr = membershipId.getValue()
        })

        // TX commit 後に WS 配信
        this.notificationService.flush()

        return { communityId: communityIdStr, membershipId: membershipIdStr }
    }
}
