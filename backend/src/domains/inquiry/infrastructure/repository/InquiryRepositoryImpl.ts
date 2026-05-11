import type {
    AddOperatorMessageResult,
    CreateAnonymousInquiryInput,
    IInquiryRepository,
    InquiryCategoryMasterRow,
    InquiryWithRelations,
    ListInquiriesFilter,
} from '@/domains/inquiry/domain/repository/IInquiryRepository.js'
import type { Prisma, PrismaClient } from '@prisma/client'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class InquiryRepositoryImpl implements IInquiryRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async findCategoryBySlug(slug: string): Promise<InquiryCategoryMasterRow | null> {
        const row = await this.db.inquiryCategoryMaster.findUnique({ where: { slug } })
        if (!row) return null
        return {
            id: row.id,
            slug: row.slug,
            labelI18n: row.labelI18n,
            relatedHelpCategorySlug: row.relatedHelpCategorySlug,
            isAnonymousOnly: row.isAnonymousOnly,
            isActive: row.isActive,
        }
    }

    async listCategories(opts: { includeAnonymous: boolean }) {
        return this.db.inquiryCategoryMaster.findMany({
            where: {
                isActive: true,
                ...(opts.includeAnonymous ? {} : { isAnonymousOnly: false }),
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                labelI18n: true,
                relatedHelpCategorySlug: true,
                isAnonymousOnly: true,
            },
        })
    }

    async createAnonymousInquiry(input: CreateAnonymousInquiryInput): Promise<{ id: string }> {
        const created = await this.db.inquiry.create({
            data: {
                userId: null,
                contactEmail: input.contactEmail,
                categoryId: input.categoryId,
                title: input.title,
                status: 'OPEN',
                messages: {
                    create: {
                        authorType: 'USER',
                        body: input.body,
                        attachments: {
                            create: input.attachments.map((a) => ({
                                storageKey: a.storageKey,
                                fileName: a.fileName,
                                mimeType: a.mimeType,
                                sizeBytes: a.sizeBytes,
                                scanStatus: 'PENDING',
                            })),
                        },
                    },
                },
            },
            select: { id: true },
        })
        return { id: created.id }
    }

    async listAdmin(filter: ListInquiriesFilter): Promise<InquiryWithRelations[]> {
        const assigneeWhere: Prisma.InquiryWhereInput =
            filter.assigneeFilterMode === 'me' && filter.assigneeUserId
                ? { assigneeUserId: filter.assigneeUserId }
                : filter.assigneeFilterMode === 'unassigned'
                    ? { assigneeUserId: null }
                    : {}

        const items = await this.db.inquiry.findMany({
            where: {
                ...(filter.status ? { status: filter.status } : {}),
                ...(filter.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
                ...assigneeWhere,
            },
            orderBy: { lastActivityAt: 'desc' },
            take: 100,
            include: {
                category: { select: { slug: true, labelI18n: true } },
                user: { select: { id: true, displayName: true, email: true } },
                assignee: { select: { id: true, displayName: true, email: true } },
            },
        })

        return items.map((it) => ({
            id: it.id,
            title: it.title,
            status: it.status,
            lastActivityAt: it.lastActivityAt,
            createdAt: it.createdAt,
            contactEmail: it.contactEmail,
            category: { slug: it.category.slug, labelI18n: it.category.labelI18n },
            user: it.user,
            assignee: it.assignee,
        }))
    }

    async findByIdAdmin(id: string): Promise<InquiryWithRelations | null> {
        const inq = await this.db.inquiry.findUnique({
            where: { id },
            include: {
                category: true,
                user: { select: { id: true, displayName: true, email: true } },
                assignee: { select: { id: true, displayName: true, email: true } },
                messages: {
                    include: { attachments: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        })
        if (!inq) return null
        return {
            id: inq.id,
            title: inq.title,
            status: inq.status,
            lastActivityAt: inq.lastActivityAt,
            createdAt: inq.createdAt,
            contactEmail: inq.contactEmail,
            category: { slug: inq.category.slug, labelI18n: inq.category.labelI18n },
            user: inq.user,
            assignee: inq.assignee,
            messages: inq.messages.map((m) => ({
                id: m.id,
                authorType: m.authorType,
                body: m.body,
                createdAt: m.createdAt,
                attachments: m.attachments.map((a) => ({
                    id: a.id,
                    fileName: a.fileName,
                    mimeType: a.mimeType,
                    sizeBytes: a.sizeBytes,
                    scanStatus: a.scanStatus,
                })),
            })),
        }
    }

    async updateStatus(
        id: string,
        status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    ) {
        return this.db.inquiry.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
                lastActivityAt: new Date(),
            },
            select: { id: true, status: true, resolvedAt: true },
        })
    }

    async findCoreById(id: string) {
        return this.db.inquiry.findUnique({
            where: { id },
            select: { id: true, userId: true, status: true, title: true },
        })
    }

    async addOperatorMessage(input: {
        inquiryId: string
        operatorUserId: string
        body: string
        attachments: { storageKey: string; fileName: string; mimeType: string; sizeBytes: number }[]
    }): Promise<AddOperatorMessageResult> {
        // PrismaClient と TransactionClient の両方で動くように、
        // 既にトランザクション内なら `$transaction` を持たないため分岐する
        const dbAny = this.db as unknown as { $transaction?: PrismaClient['$transaction'] }
        const run = async (tx: Prisma.TransactionClient) => {
            const inq = await tx.inquiry.findUnique({
                where: { id: input.inquiryId },
                select: { id: true, userId: true, status: true, title: true },
            })
            if (!inq) {
                throw new Error('INQUIRY_NOT_FOUND')
            }
            const message = await tx.inquiryMessage.create({
                data: {
                    inquiryId: input.inquiryId,
                    authorType: 'OPERATOR',
                    authorUserId: input.operatorUserId,
                    body: input.body,
                    attachments: {
                        create: input.attachments.map((a) => ({
                            storageKey: a.storageKey,
                            fileName: a.fileName,
                            mimeType: a.mimeType,
                            sizeBytes: a.sizeBytes,
                            scanStatus: 'PENDING',
                        })),
                    },
                },
                include: { attachments: true },
            })
            const newStatus = inq.status === 'OPEN' ? 'IN_PROGRESS' : inq.status
            await tx.inquiry.update({
                where: { id: input.inquiryId },
                data: { lastActivityAt: new Date(), status: newStatus },
            })
            return {
                message: {
                    id: message.id,
                    authorType: message.authorType,
                    body: message.body,
                    createdAt: message.createdAt,
                    attachments: message.attachments.map((a) => ({
                        id: a.id,
                        fileName: a.fileName,
                        mimeType: a.mimeType,
                        sizeBytes: a.sizeBytes,
                        scanStatus: a.scanStatus,
                    })),
                },
                inquiry: { id: inq.id, userId: inq.userId, title: inq.title },
            }
        }
        if (dbAny.$transaction) {
            return (this.db as PrismaClient).$transaction(async (tx) => run(tx))
        }
        return run(this.db as Prisma.TransactionClient)
    }

    async updateAssignee(id: string, assigneeUserId: string | null) {
        const updated = await this.db.inquiry.update({
            where: { id },
            data: { assigneeUserId, lastActivityAt: new Date() },
            include: {
                assignee: { select: { id: true, displayName: true, email: true } },
            },
        })
        return {
            id: updated.id,
            assignee: updated.assignee,
        }
    }
}
