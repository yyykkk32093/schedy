import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { CommunityNotFoundError } from '@/application/community/error/CommunityNotFoundError.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { Poll } from '@/domains/poll/domain/model/entity/Poll.js'
import { PollOption } from '@/domains/poll/domain/model/entity/PollOption.js'
import { PollId } from '@/domains/poll/domain/model/valueObject/PollId.js'
import { PollOptionId } from '@/domains/poll/domain/model/valueObject/PollOptionId.js'
import { PollOptionText } from '@/domains/poll/domain/model/valueObject/PollOptionText.js'
import { PollQuestion } from '@/domains/poll/domain/model/valueObject/PollQuestion.js'
import type { IPollRepository } from '@/domains/poll/domain/repository/IPollRepository.js'
import type { ICommunityWebhookConfigRepository } from '@/domains/webhook/domain/repository/ICommunityWebhookConfigRepository.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { randomUUID } from 'crypto'
import { PollPermissionError } from '../error/PollPermissionError.js'

export type CreatePollTxRepositories = {
    poll: IPollRepository
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

export class CreatePollUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreatePollTxRepositories>,
        private readonly notificationService: NotificationService,
        private readonly webhookConfigRepo: ICommunityWebhookConfigRepository,
    ) { }

    async execute(input: {
        communityId: string
        announcementId: string | null
        question: string
        isMultipleChoice: boolean
        deadline: string | null
        options: string[]
        userId: string
    }): Promise<{ pollId: string }> {
        let pollId = ''

        await this.unitOfWork.run(async (repos) => {
            const community = await repos.community.findById(input.communityId)
            if (!community) throw new CommunityNotFoundError()

            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new PollPermissionError('投票の作成はOWNERまたはADMINのみ実行できます')
            }

            const id = PollId.create(this.idGenerator.generate())
            const options = input.options.map((text, index) =>
                PollOption.create({
                    id: PollOptionId.create(this.idGenerator.generate()),
                    pollId: id.getValue(),
                    text: PollOptionText.create(text),
                    sortOrder: index,
                }),
            )

            const poll = Poll.create({
                id,
                communityId: CommunityId.create(input.communityId),
                announcementId: input.announcementId,
                question: PollQuestion.create(input.question),
                isMultipleChoice: input.isMultipleChoice,
                deadline: input.deadline ? new Date(input.deadline) : null,
                createdBy: UserId.create(input.userId),
                options,
            })

            await repos.poll.save(poll)
            pollId = id.getValue()

            // コミュニティ全アクティブメンバーに通知（投稿者本人を除く）
            const allMembers = await repos.membership.findsByCommunityId(input.communityId)
            const recipients = allMembers.filter(
                (m) => m.isActive() && m.getUserId().getValue() !== input.userId,
            )
            for (const member of recipients) {
                await this.notificationService.prepareNotification(repos, {
                    userId: member.getUserId().getValue(),
                    type: 'POLL',
                    title: '投票が作成されました',
                    body: input.question,
                    referenceId: pollId,
                    referenceType: 'POLL',
                })
            }

            // LINE Webhook 設定が有効な場合のみ OutboxEvent を保存（UBL-29）
            const lineConfig = await this.webhookConfigRepo.findByCommunityAndService(
                input.communityId, 'LINE',
            )
            if (lineConfig && lineConfig.enabled) {
                const webhookOutbox = new OutboxEvent({
                    outboxEventId: randomUUID(),
                    idempotencyKey: `webhook:poll:${pollId}`,
                    aggregateId: input.communityId,
                    eventName: 'PollCreated',
                    eventType: 'webhook.poll',
                    routingKey: 'webhook.line',
                    payload: {
                        communityId: input.communityId,
                        type: 'POLL',
                        title: input.question,
                        body: `選択肢: ${input.options.join(' / ')}`,
                    },
                    occurredAt: new Date(),
                })
                await repos.outbox.save(webhookOutbox)
            }
        })

        this.notificationService.flush()
        return { pollId }
    }
}
