import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { Prisma, Announcement as PrismaAnnouncement, PrismaClient } from '@prisma/client'
import { Announcement } from '../../domain/model/entity/Announcement.js'
import { AnnouncementContent } from '../../domain/model/valueObject/AnnouncementContent.js'
import { AnnouncementId } from '../../domain/model/valueObject/AnnouncementId.js'
import { AnnouncementTitle } from '../../domain/model/valueObject/AnnouncementTitle.js'
import type { AnnouncementDetailRow, AnnouncementFeedRow, IAnnouncementRepository } from '../../domain/repository/IAnnouncementRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class AnnouncementRepositoryImpl implements IAnnouncementRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Announcement | null> {
        const row = await this.prisma.announcement.findFirst({
            where: { id, deletedAt: null },
        })
        return row ? this.toDomain(row) : null
    }

    async findDetailById(id: string): Promise<AnnouncementDetailRow | null> {
        const row = await this.prisma.announcement.findFirst({
            where: { id, deletedAt: null },
            include: {
                attachments: {
                    select: { id: true, fileUrl: true, mimeType: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        })
        if (!row) return null
        return {
            id: row.id,
            communityId: row.communityId,
            authorId: row.authorId,
            title: row.title,
            content: row.content,
            createdAt: row.createdAt,
            attachments: row.attachments.map((a) => ({
                id: a.id,
                fileUrl: a.fileUrl,
                mimeType: a.mimeType,
            })),
        }
    }

    async findsByCommunityId(communityId: string): Promise<Announcement[]> {
        const rows = await this.prisma.announcement.findMany({
            where: { communityId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async save(
        announcement: Announcement,
        attachments?: Array<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number }>,
    ): Promise<void> {
        await this.prisma.announcement.upsert({
            where: { id: announcement.getId().getValue() },
            create: {
                id: announcement.getId().getValue(),
                communityId: announcement.getCommunityId().getValue(),
                authorId: announcement.getAuthorId().getValue(),
                title: announcement.getTitle().getValue(),
                content: announcement.getContent().getValue(),
                deletedAt: announcement.getDeletedAt(),
                ...(attachments && attachments.length > 0
                    ? {
                        attachments: {
                            create: attachments.map((att, i) => ({
                                fileUrl: att.fileUrl,
                                fileName: att.fileName,
                                mimeType: att.mimeType,
                                fileSize: att.fileSize,
                                sortOrder: i,
                            })),
                        },
                    }
                    : {}),
            },
            update: {
                title: announcement.getTitle().getValue(),
                content: announcement.getContent().getValue(),
                deletedAt: announcement.getDeletedAt(),
            },
        })
    }

    private toDomain(row: PrismaAnnouncement): Announcement {
        return Announcement.reconstruct({
            id: AnnouncementId.reconstruct(row.id),
            communityId: CommunityId.reconstruct(row.communityId),
            authorId: UserId.create(row.authorId),
            title: AnnouncementTitle.reconstruct(row.title),
            content: AnnouncementContent.reconstruct(row.content),
            deletedAt: row.deletedAt,
            createdAt: row.createdAt,
        })
    }

    async findFeedByCommunityIds(
        communityIds: string[],
        options: { cursor?: string; limit: number },
    ): Promise<AnnouncementFeedRow[]> {
        if (communityIds.length === 0) return []

        const rows = await this.prisma.announcement.findMany({
            where: {
                communityId: { in: communityIds },
                deletedAt: null,
                ...(options.cursor ? { createdAt: { lt: (await this.prisma.announcement.findUnique({ where: { id: options.cursor }, select: { createdAt: true } }))?.createdAt ?? new Date() } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: options.limit,
            include: {
                community: { select: { name: true, logoUrl: true } },
                attachments: { select: { id: true, fileUrl: true, mimeType: true }, orderBy: { sortOrder: 'asc' } },
            },
        })

        // author情報をまとめて取得
        const authorIds = [...new Set(rows.map((r) => r.authorId))]
        const users = await this.prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, displayName: true, avatarUrl: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        return rows.map((r) => {
            const author = userMap.get(r.authorId)
            return {
                id: r.id,
                communityId: r.communityId,
                authorId: r.authorId,
                title: r.title,
                content: r.content,
                createdAt: r.createdAt,
                authorName: author?.displayName ?? null,
                authorAvatarUrl: author?.avatarUrl ?? null,
                communityName: r.community.name,
                communityLogoUrl: r.community.logoUrl,
                attachments: r.attachments.map((a) => ({
                    id: a.id,
                    fileUrl: a.fileUrl,
                    mimeType: a.mimeType,
                })),
            }
        })
    }

    async searchByKeyword(
        communityIds: string[],
        keyword: string,
        options: { limit: number; offset: number },
    ): Promise<AnnouncementFeedRow[]> {
        if (communityIds.length === 0 || !keyword.trim()) return []

        const rows = await this.prisma.announcement.findMany({
            where: {
                communityId: { in: communityIds },
                deletedAt: null,
                OR: [
                    { title: { contains: keyword, mode: 'insensitive' } },
                    { content: { contains: keyword, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: options.limit,
            skip: options.offset,
            include: {
                community: { select: { name: true, logoUrl: true } },
                attachments: { select: { id: true, fileUrl: true, mimeType: true }, orderBy: { sortOrder: 'asc' } },
            },
        })

        const authorIds = [...new Set(rows.map((r) => r.authorId))]
        const users = await this.prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, displayName: true, avatarUrl: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        return rows.map((r) => {
            const author = userMap.get(r.authorId)
            return {
                id: r.id,
                communityId: r.communityId,
                authorId: r.authorId,
                title: r.title,
                content: r.content,
                createdAt: r.createdAt,
                authorName: author?.displayName ?? null,
                authorAvatarUrl: author?.avatarUrl ?? null,
                communityName: r.community.name,
                communityLogoUrl: r.community.logoUrl,
                attachments: r.attachments.map((a) => ({
                    id: a.id,
                    fileUrl: a.fileUrl,
                    mimeType: a.mimeType,
                })),
            }
        })
    }
}
