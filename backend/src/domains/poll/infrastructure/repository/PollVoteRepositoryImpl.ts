import type { Prisma, PrismaClient } from '@prisma/client'
import type { IPollVoteRepository } from '../../domain/repository/IPollVoteRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class PollVoteRepositoryImpl implements IPollVoteRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async castVote(params: {
        id: string
        pollOptionId: string
        userId: string
        isMultipleChoice: boolean
        pollId: string
    }): Promise<void> {
        if (!params.isMultipleChoice) {
            // 単一選択: 同じ Poll の既存投票を全削除してから投票
            const existingOptions = await this.prisma.pollOption.findMany({
                where: { pollId: params.pollId },
                select: { id: true },
            })
            const optionIds = existingOptions.map((o) => o.id)

            await this.prisma.pollVote.deleteMany({
                where: {
                    pollOptionId: { in: optionIds },
                    userId: params.userId,
                },
            })
        }

        await this.prisma.pollVote.upsert({
            where: {
                pollOptionId_userId: {
                    pollOptionId: params.pollOptionId,
                    userId: params.userId,
                },
            },
            create: {
                id: params.id,
                pollOptionId: params.pollOptionId,
                userId: params.userId,
            },
            update: {},
        })
    }

    async findUserVotes(pollId: string, userId: string): Promise<string[]> {
        const options = await this.prisma.pollOption.findMany({
            where: { pollId },
            select: { id: true },
        })
        const optionIds = options.map((o) => o.id)

        const votes = await this.prisma.pollVote.findMany({
            where: {
                pollOptionId: { in: optionIds },
                userId,
            },
            select: { pollOptionId: true },
        })
        return votes.map((v) => v.pollOptionId)
    }

    async removeVote(pollOptionId: string, userId: string): Promise<void> {
        await this.prisma.pollVote.deleteMany({
            where: { pollOptionId, userId },
        })
    }
}
