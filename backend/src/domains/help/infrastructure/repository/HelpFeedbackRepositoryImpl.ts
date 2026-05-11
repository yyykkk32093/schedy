import type { Prisma, PrismaClient } from '@prisma/client'
import type {
    HelpFeedbackCreateInput,
    HelpFeedbackExportRow,
    HelpFeedbackSummaryGroup,
    HelpFeedbackUpsertInput,
    IHelpFeedbackRepository,
} from '../../domain/repository/IHelpFeedbackRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class HelpFeedbackRepositoryImpl implements IHelpFeedbackRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async upsertByUser(input: HelpFeedbackUpsertInput): Promise<void> {
        await this.db.helpFeedback.upsert({
            where: { userId_articleSlug: { userId: input.userId, articleSlug: input.articleSlug } },
            create: {
                userId: input.userId,
                articleSlug: input.articleSlug,
                categorySlug: input.categorySlug,
                helpful: input.helpful,
                comment: input.comment,
            },
            update: {
                helpful: input.helpful,
                comment: input.comment,
                categorySlug: input.categorySlug,
            },
        })
    }

    async createAnonymous(input: HelpFeedbackCreateInput): Promise<void> {
        await this.db.helpFeedback.create({
            data: {
                userId: null,
                articleSlug: input.articleSlug,
                categorySlug: input.categorySlug,
                helpful: input.helpful,
                comment: input.comment,
            },
        })
    }

    async groupBySummary(): Promise<HelpFeedbackSummaryGroup[]> {
        const grouped = await this.db.helpFeedback.groupBy({
            by: ['categorySlug', 'articleSlug', 'helpful'],
            _count: { _all: true },
            _max: { createdAt: true },
        })
        return grouped.map(g => ({
            categorySlug: g.categorySlug,
            articleSlug: g.articleSlug,
            helpful: g.helpful,
            count: g._count._all,
            lastCreatedAt: g._max.createdAt,
        }))
    }

    async findAllForExport(): Promise<HelpFeedbackExportRow[]> {
        return this.db.helpFeedback.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                articleSlug: true,
                categorySlug: true,
                helpful: true,
                comment: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
            },
        })
    }
}
