import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { Prisma, PrismaClient, Poll as PrismaPoll, PollOption as PrismaPollOption } from '@prisma/client'
import { Poll } from '../../domain/model/entity/Poll.js'
import { PollOption } from '../../domain/model/entity/PollOption.js'
import { PollId } from '../../domain/model/valueObject/PollId.js'
import { PollOptionId } from '../../domain/model/valueObject/PollOptionId.js'
import { PollOptionText } from '../../domain/model/valueObject/PollOptionText.js'
import { PollQuestion } from '../../domain/model/valueObject/PollQuestion.js'
import type { IPollRepository, PollResultRow } from '../../domain/repository/IPollRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class PollRepositoryImpl implements IPollRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Poll | null> {
        const row = await this.prisma.poll.findFirst({
            where: { id, deletedAt: null },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByCommunityId(communityId: string): Promise<Poll[]> {
        const rows = await this.prisma.poll.findMany({
            where: { communityId, deletedAt: null },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async findsByAnnouncementId(announcementId: string): Promise<Poll[]> {
        const rows = await this.prisma.poll.findMany({
            where: { announcementId, deletedAt: null },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async save(poll: Poll): Promise<void> {
        await this.prisma.poll.upsert({
            where: { id: poll.getId().getValue() },
            create: {
                id: poll.getId().getValue(),
                communityId: poll.getCommunityId().getValue(),
                announcementId: poll.getAnnouncementId(),
                question: poll.getQuestion().getValue(),
                isMultipleChoice: poll.getIsMultipleChoice(),
                deadline: poll.getDeadline(),
                createdBy: poll.getCreatedBy().getValue(),
                deletedAt: poll.getDeletedAt(),
            },
            update: {
                deletedAt: poll.getDeletedAt(),
            },
        })

        // options は作成時のみ（更新不可）
        const existingOptions = await this.prisma.pollOption.findMany({
            where: { pollId: poll.getId().getValue() },
            select: { id: true },
        })
        if (existingOptions.length === 0 && poll.getOptions().length > 0) {
            await this.prisma.pollOption.createMany({
                data: poll.getOptions().map((o) => ({
                    id: o.getId().getValue(),
                    pollId: poll.getId().getValue(),
                    text: o.getText().getValue(),
                    sortOrder: o.getSortOrder(),
                })),
            })
        }
    }

    async findResultById(pollId: string): Promise<PollResultRow | null> {
        const row = await this.prisma.poll.findFirst({
            where: { id: pollId, deletedAt: null },
            include: {
                options: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        votes: {
                            select: { userId: true },
                        },
                    },
                },
            },
        })
        if (!row) return null

        // voter の表示名を取得
        const allVoterIds = [...new Set(row.options.flatMap((o) => o.votes.map((v) => v.userId)))]
        const users = allVoterIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: allVoterIds } },
                select: { id: true, displayName: true, avatarUrl: true },
            })
            : []
        const userMap = new Map(users.map((u) => [u.id, u]))

        let totalVotes = 0
        const options = row.options.map((o) => {
            totalVotes += o.votes.length
            return {
                id: o.id,
                text: o.text,
                sortOrder: o.sortOrder,
                voteCount: o.votes.length,
                voters: o.votes.map((v) => {
                    const user = userMap.get(v.userId)
                    return {
                        userId: v.userId,
                        displayName: user?.displayName ?? null,
                        avatarUrl: user?.avatarUrl ?? null,
                    }
                }),
            }
        })

        return {
            id: row.id,
            communityId: row.communityId,
            announcementId: row.announcementId,
            question: row.question,
            isMultipleChoice: row.isMultipleChoice,
            deadline: row.deadline?.toISOString() ?? null,
            createdBy: row.createdBy,
            createdAt: row.createdAt.toISOString(),
            options,
            totalVotes,
        }
    }

    private toDomain(row: PrismaPoll & { options: PrismaPollOption[] }): Poll {
        return Poll.reconstruct({
            id: PollId.reconstruct(row.id),
            communityId: CommunityId.reconstruct(row.communityId),
            announcementId: row.announcementId,
            question: PollQuestion.reconstruct(row.question),
            isMultipleChoice: row.isMultipleChoice,
            deadline: row.deadline,
            createdBy: UserId.create(row.createdBy),
            deletedAt: row.deletedAt,
            createdAt: row.createdAt,
            options: row.options.map((o) =>
                PollOption.reconstruct({
                    id: PollOptionId.reconstruct(o.id),
                    pollId: o.pollId,
                    text: PollOptionText.reconstruct(o.text),
                    sortOrder: o.sortOrder,
                }),
            ),
        })
    }
}
