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
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { CommunityGradePolicy } from '@/domains/community/domain/service/CommunityGradePolicy.js'
import { CommunityMembership } from '@/domains/community/membership/domain/model/entity/CommunityMembership.js'
import { MembershipId } from '@/domains/community/membership/domain/model/valueObject/MembershipId.js'
import { MembershipRole } from '@/domains/community/membership/domain/model/valueObject/MembershipRole.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

export type CreateSubCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    user: IUserRepository
    outbox: IOutboxRepository
}

export class CreateSubCommunityUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateSubCommunityTxRepositories>,
        private readonly integrationEventFactory: IntegrationEventFactory,
        private readonly outboxEventFactory: OutboxEventFactory,
        private readonly domainEventFlusher: DomainEventFlusher,
    ) { }

    async execute(input: {
        parentId: string
        name: string
        description?: string | null
        userId: string
    }): Promise<{ communityId: string }> {
        const communityId = CommunityId.create(this.idGenerator.generate())
        const name = CommunityName.create(input.name)
        const description = CommunityDescription.createNullable(input.description)
        const createdBy = UserId.create(input.userId)

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

            // 子コミュニティ作成（depth バリデーション含む）
            const child = Community.createChild({
                id: communityId,
                name,
                description,
                grade,
                parentId: parent.getId(),
                parentDepth: parent.getDepth(),
                createdBy,
            })
            await repos.community.save(child)

            // 作成者を OWNER として Membership 作成
            const childMembership = CommunityMembership.create({
                id: MembershipId.create(this.idGenerator.generate()),
                communityId,
                userId: createdBy,
                role: MembershipRole.owner(),
            })
            await repos.membership.save(childMembership)

            // ドメインイベント → Outbox
            const domainEvents = child.pullDomainEvents()
            const integrationEvents = domainEvents.flatMap((e) =>
                this.integrationEventFactory.createManyFrom(e)
            )
            const outboxEvents = this.outboxEventFactory.createManyFrom(integrationEvents)
            await repos.outbox.saveMany(outboxEvents)

            eventsToPublish = domainEvents
        })

        await this.domainEventFlusher.publish(eventsToPublish)

        return { communityId: communityId.getValue() }
    }
}
