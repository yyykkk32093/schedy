import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { Community } from '@/domains/community/domain/model/entity/Community.js'
import { CommunityDescription } from '@/domains/community/domain/model/valueObject/CommunityDescription.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import { CommunityName } from '@/domains/community/domain/model/valueObject/CommunityName.js'
import { JoinMethod } from '@/domains/community/domain/model/valueObject/JoinMethod.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { CommunityGradePolicy } from '@/domains/community/domain/service/CommunityGradePolicy.js'
import { CommunityMembership } from '@/domains/community/membership/domain/model/entity/CommunityMembership.js'
import { MembershipId } from '@/domains/community/membership/domain/model/valueObject/MembershipId.js'
import { MembershipRole } from '@/domains/community/membership/domain/model/valueObject/MembershipRole.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { Prisma } from '@prisma/client'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'
import { copyParentMembersToChild } from '../helper/membershipPropagation.js'

export type CreateSubCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    user: IUserRepository
    tx: Prisma.TransactionClient
}

export class CreateSubCommunityUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateSubCommunityTxRepositories>,
        private readonly domainEventFlusher: DomainEventFlusher,
    ) { }

    async execute(input: {
        parentId: string
        name: string
        description?: string | null
        userId: string
        /** 親の設定を全て引き継ぐ（デフォルト true） */
        inheritSettings?: boolean
        /** メンバー引き継ぎ方式 */
        memberInheritance?: 'ALL' | 'SELECT' | 'OWNER_ONLY' | 'ADMIN_AND_ABOVE'
        /** SELECT 時の選択メンバーID */
        selectedMemberIds?: string[]
        // --- 入力し直す場合の設定フィールド ---
        joinMethod?: string
        isPublic?: boolean
        maxMembers?: number | null
        targetGender?: string[]
        ageMin?: number | null
        ageMax?: number | null
        activityFrequency?: string | null
        activityDays?: string[]
        categoryIds?: string[]
        recommendedLevelMin?: number | null
        recommendedLevelMax?: number | null
        tags?: string[]
    }): Promise<{ communityId: string }> {
        const communityId = CommunityId.create(this.idGenerator.generate())
        const name = CommunityName.create(input.name)
        const description = CommunityDescription.createNullable(input.description)
        const createdBy = UserId.create(input.userId)
        const shouldInheritSettings = input.inheritSettings !== false
        const memberMode = input.memberInheritance ?? 'ADMIN_AND_ABOVE'

        let eventsToPublish: BaseDomainEvent[] = []

        await this.unitOfWork.run(async (repos) => {
            // 親コミュニティ取得
            const parent = await repos.community.findById(input.parentId)
            if (!parent) throw new CommunityNotFoundError()

            // 権限チェック: OWNER のみサブコミュニティ作成可
            const membership = await repos.membership.findByCommunityAndUser(
                input.parentId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().isOwner()) {
                throw new CommunityPermissionError('サブコミュニティの作成はOWNERのみ実行できます')
            }

            // OWNER の plan から grade を決定
            const user = await repos.user.findById(input.userId)
            if (!user) throw new Error('User not found')
            const grade = CommunityGradePolicy.gradeFromPlan(user.getPlan())

            // 設定を決定: 引き継ぎか入力し直しか
            // カテゴリは join table から取得
            let childCategoryIds: string[]
            if (shouldInheritSettings) {
                const parentCategories = await repos.tx.communityCategory.findMany({
                    where: { communityId: input.parentId },
                    select: { categoryId: true },
                })
                childCategoryIds = parentCategories.map((c) => c.categoryId)
            } else {
                childCategoryIds = input.categoryIds ?? []
            }

            const childSettings = shouldInheritSettings
                ? {
                    // 親の設定をそのままコピー
                    joinMethod: parent.getJoinMethod(),
                    isPublic: parent.getIsPublic(),
                    maxMembers: parent.getMaxMembers(),
                    activityFrequency: parent.getActivityFrequency(),
                    targetGender: parent.getTargetGender(),
                    ageMin: parent.getAgeMin(),
                    ageMax: parent.getAgeMax(),
                    recommendedLevelMin: parent.getRecommendedLevelMin(),
                    recommendedLevelMax: parent.getRecommendedLevelMax(),
                }
                : {
                    // フロントから入力された設定を使用
                    joinMethod: input.joinMethod ? JoinMethod.create(input.joinMethod) : undefined,
                    isPublic: input.isPublic,
                    maxMembers: input.maxMembers,
                    activityFrequency: input.activityFrequency,
                    targetGender: input.targetGender,
                    ageMin: input.ageMin,
                    ageMax: input.ageMax,
                    recommendedLevelMin: input.recommendedLevelMin,
                    recommendedLevelMax: input.recommendedLevelMax,
                }

            // 子コミュニティ作成（depth バリデーション含む）
            const child = Community.createChild({
                id: communityId,
                name,
                description,
                grade,
                parentId: parent.getId(),
                parentDepth: parent.getDepth(),
                createdBy,
                ...childSettings,
            })
            await repos.community.save(child)

            // CommunityCategory join table への保存
            if (childCategoryIds.length > 0) {
                await repos.tx.communityCategory.createMany({
                    data: childCategoryIds.map((categoryId) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityId.getValue(),
                        categoryId,
                    })),
                })
            }

            // 作成者を OWNER として Membership 作成
            const childMembership = CommunityMembership.create({
                id: MembershipId.create(this.idGenerator.generate()),
                communityId,
                userId: createdBy,
                role: MembershipRole.owner(),
            })
            await repos.membership.save(childMembership)

            // メンバー引き継ぎ
            await copyParentMembersToChild(
                repos, this.idGenerator,
                input.parentId, communityId.getValue(), input.userId,
                memberMode, input.selectedMemberIds,
            )

            eventsToPublish = child.pullDomainEvents()
        })

        await this.domainEventFlusher.publish(eventsToPublish)

        return { communityId: communityId.getValue() }
    }
}
