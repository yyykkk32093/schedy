import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
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
import type { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import type { Prisma } from '@prisma/client'

export type CreateCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    user: IUserRepository
    outbox: IOutboxRepository
    tx: Prisma.TransactionClient
}

export class CreateCommunityUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateCommunityTxRepositories>,
        private readonly integrationEventFactory: IntegrationEventFactory,
        private readonly outboxEventFactory: OutboxEventFactory,
        private readonly domainEventFlusher: DomainEventFlusher,
    ) { }

    async execute(input: {
        name: string
        description?: string | null
        userId: string
        communityTypeId?: string | null
        joinMethod?: string
        isPublic?: boolean
        maxMembers?: number | null
        mainActivityArea?: string | null
        activityFrequency?: string | null
        nearestStation?: string | null
        targetGender?: string | null
        ageRange?: string | null
        categoryIds?: string[]
        participationLevelIds?: string[]
        activityDays?: string[]
        tags?: string[]
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
                communityTypeId: input.communityTypeId,
                joinMethod,
                isPublic: input.isPublic,
                maxMembers: input.maxMembers,
                mainActivityArea: input.mainActivityArea,
                activityFrequency: input.activityFrequency,
                nearestStation: input.nearestStation,
                targetGender: input.targetGender,
                ageRange: input.ageRange,
            })
            await repos.community.save(community)

            // 中間テーブル・値テーブルの保存
            const communityIdValue = communityId.getValue()
            const { tx } = repos

            if (input.categoryIds && input.categoryIds.length > 0) {
                await tx.communityCategory.createMany({
                    data: input.categoryIds.map((categoryId) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        categoryId,
                    })),
                })
            }

            if (input.participationLevelIds && input.participationLevelIds.length > 0) {
                await tx.communityParticipationLevel.createMany({
                    data: input.participationLevelIds.map((levelId) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        levelId,
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
                await tx.communityTag.createMany({
                    data: input.tags.map((tag) => ({
                        id: this.idGenerator.generate(),
                        communityId: communityIdValue,
                        tag,
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

            // ドメインイベント取り出し → Outbox 保存
            const domainEvents = community.pullDomainEvents()
            const integrationEvents = domainEvents.flatMap((e) =>
                this.integrationEventFactory.createManyFrom(e)
            )
            const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
            await repos.outbox.saveMany(outboxEvents)

            eventsToPublish = domainEvents
        })

        // commit 後: in-process イベント配信
        await this.domainEventFlusher.publish(eventsToPublish)

        return { communityId: communityId.getValue() }
    }
}
