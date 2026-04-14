import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { CommunityLimitKey } from '@/domains/_sharedDomains/featureGate/CommunityFeature.js'
import type { FeatureGateService } from '@/domains/_sharedDomains/featureGate/FeatureGateService.js'
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

export type CreateCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    user: IUserRepository
    tx: Prisma.TransactionClient
}

export class CreateCommunityUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateCommunityTxRepositories>,
        private readonly domainEventFlusher: DomainEventFlusher,
        private readonly featureGateService: FeatureGateService,
    ) { }

    async execute(input: {
        name: string
        description?: string | null
        userId: string
        joinMethod?: string
        isPublic?: boolean
        maxMembers?: number | null
        activityFrequency?: string | null
        targetGender?: string[]
        ageMin?: number | null
        ageMax?: number | null
        categoryIds: string[]
        recommendedLevelMin?: number | null
        recommendedLevelMax?: number | null
        activityDays?: string[]
        tags?: string[]
        locations?: Array<{ type: 'MAIN' | 'SUB'; area: string; station?: string }>
    }): Promise<{ communityId: string }> {
        const communityId = CommunityId.create(this.idGenerator.generate())
        const name = CommunityName.create(input.name)
        const description = CommunityDescription.createNullable(input.description)
        const createdBy = UserId.create(input.userId)
        const joinMethod = input.joinMethod ? JoinMethod.create(input.joinMethod) : undefined

        let eventsToPublish: BaseDomainEvent[] = []

        await this.unitOfWork.run(async (repos) => {
            // OWNER の plan から grade を決定
            const user = await repos.user.findById(input.userId)
            if (!user) throw new Error('User not found')
            const grade = CommunityGradePolicy.gradeFromPlan(user.getPlan())

            // Community 作成
            const community = Community.create({
                id: communityId,
                name,
                description,
                grade,
                createdBy,
                joinMethod,
                isPublic: input.isPublic,
                maxMembers: input.maxMembers,
                activityFrequency: input.activityFrequency,
                targetGender: input.targetGender,
                ageMin: input.ageMin,
                ageMax: input.ageMax,
                recommendedLevelMin: input.recommendedLevelMin,
                recommendedLevelMax: input.recommendedLevelMax,
            })
            await repos.community.save(community)

            // 中間テーブル・値テーブルの保存
            const communityIdValue = communityId.getValue()
            const { tx } = repos

            // CommunityCategory join table への保存
            if (input.categoryIds.length > 0) {
                await tx.communityCategory.createMany({
                    data: input.categoryIds.map((categoryId) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        categoryId,
                    })),
                })
            }

            if (input.activityDays && input.activityDays.length > 0) {
                await tx.communityActivityDay.createMany({
                    data: input.activityDays.map((day) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        day,
                    })),
                })
            }

            if (input.tags && input.tags.length > 0) {
                // タグ上限チェック
                const maxTags = await this.featureGateService.getCommunityLimit(
                    grade.getValue(),
                    CommunityLimitKey.MAX_TAGS,
                )
                if (maxTags !== -1 && input.tags.length > maxTags) {
                    throw new Error(
                        `タグ数が上限を超えています（上限: ${maxTags}件、指定: ${input.tags.length}件）`,
                    )
                }

                await tx.communityTag.createMany({
                    data: input.tags.map((tag) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        tag,
                    })),
                })
            }

            if (input.locations && input.locations.length > 0) {
                const mainCount = input.locations.filter((l) => l.type === 'MAIN').length
                if (mainCount > 1) {
                    throw new Error('メイン拠点は最大1件です')
                }

                await tx.communityLocation.createMany({
                    data: input.locations.map((loc, i) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        type: loc.type,
                        area: loc.area.trim(),
                        station: loc.station?.trim() || null,
                        sortOrder: i,
                    })),
                })
            }

            // 作成者を OWNER として Membership も同時作成
            const membership = CommunityMembership.create({
                id: MembershipId.create(this.idGenerator.generate()),
                communityId,
                userId: createdBy,
                role: MembershipRole.owner(),
            })
            await repos.membership.save(membership)

            // ドメインイベント取り出し（in-process 配信用）
            eventsToPublish = community.pullDomainEvents()
        })

        // commit 後: in-process イベント配信
        await this.domainEventFlusher.publish(eventsToPublish)

        return { communityId: communityId.getValue() }
    }
}
