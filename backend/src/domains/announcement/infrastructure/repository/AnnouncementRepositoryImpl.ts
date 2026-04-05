import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ActivityId } from '@/domains/activity/domain/model/valueObject/ActivityId.js'
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

    /**
     * activityId から直近のスケジュール情報を取得するヘルパー
     * 複数 activityId を一括処理して Map で返す
     */
    private async resolveScheduleInfos(
        activityIds: string[],
    ): Promise<Map<string, { scheduleId: string; date: string; startTime: string; endTime: string }>> {
        if (activityIds.length === 0) return new Map()
        const schedules = await this.prisma.schedule.findMany({
            where: { activityId: { in: activityIds }, status: 'SCHEDULED' },
            orderBy: { date: 'asc' },
            select: { id: true, activityId: true, date: true, startTime: true, endTime: true },
        })
        // 各 activityId に対して最も近い将来 or 最新の過去スケジュールを選択
        const result = new Map<string, { scheduleId: string; date: string; startTime: string; endTime: string }>()
        const now = new Date()
        for (const s of schedules) {
            const existing = result.get(s.activityId)
            const sDate = new Date(s.date)
            if (!existing) {
                result.set(s.activityId, { scheduleId: s.id, date: s.date.toISOString().split('T')[0], startTime: s.startTime, endTime: s.endTime })
            } else {
                // 将来の日付で最も近いもの優先、なければ最新の過去
                const existingDate = new Date(existing.date)
                if (sDate >= now && (existingDate < now || sDate < existingDate)) {
                    result.set(s.activityId, { scheduleId: s.id, date: s.date.toISOString().split('T')[0], startTime: s.startTime, endTime: s.endTime })
                }
            }
        }
        return result
    }

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
                community: {
                    select: { name: true },
                },
            },
        })
        if (!row) return null

        // authorId → User を別クエリで取得（Announcementにリレーション未定義のため）
        const author = await this.prisma.user.findUnique({
            where: { id: row.authorId },
            select: { displayName: true, avatarUrl: true },
        })

        const scheduleMap = row.activityId ? await this.resolveScheduleInfos([row.activityId]) : new Map()
        return {
            id: row.id,
            communityId: row.communityId,
            activityId: row.activityId,
            authorId: row.authorId,
            authorName: author?.displayName ?? null,
            authorAvatarUrl: author?.avatarUrl ?? null,
            communityName: row.community?.name ?? '',
            title: row.title,
            content: row.content,
            createdAt: row.createdAt,
            attachments: row.attachments.map((a) => ({
                id: a.id,
                fileUrl: a.fileUrl,
                mimeType: a.mimeType,
            })),
            scheduleInfo: row.activityId ? (scheduleMap.get(row.activityId) ?? null) : null,
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
                activityId: announcement.getActivityId()?.getValue() ?? null,
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
            activityId: row.activityId ? ActivityId.reconstruct(row.activityId) : null,
            title: AnnouncementTitle.reconstruct(row.title),
            content: AnnouncementContent.reconstruct(row.content),
            deletedAt: row.deletedAt,
            createdAt: row.createdAt,
        })
    }

    async findFeedByCommunityIds(
        communityIds: string[],
        options: { cursor?: string; limit: number; activityFilter?: boolean },
    ): Promise<AnnouncementFeedRow[]> {
        if (communityIds.length === 0) return []

        const rows = await this.prisma.announcement.findMany({
            where: {
                communityId: { in: communityIds },
                deletedAt: null,
                ...(options.activityFilter ? { activityId: { not: null } } : {}),
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

        // スケジュール情報を一括取得
        const activityIds = [...new Set(rows.filter((r) => r.activityId).map((r) => r.activityId!))]
        const scheduleMap = await this.resolveScheduleInfos(activityIds)

        return rows.map((r) => {
            const author = userMap.get(r.authorId)
            return {
                id: r.id,
                communityId: r.communityId,
                activityId: r.activityId,
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
                scheduleInfo: r.activityId ? (scheduleMap.get(r.activityId) ?? null) : null,
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
                    { community: { name: { contains: keyword, mode: 'insensitive' } } },
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

        // スケジュール情報を一括取得
        const activityIds = [...new Set(rows.filter((r) => r.activityId).map((r) => r.activityId!))]
        const scheduleMap = await this.resolveScheduleInfos(activityIds)

        return rows.map((r) => {
            const author = userMap.get(r.authorId)
            return {
                id: r.id,
                communityId: r.communityId,
                activityId: r.activityId,
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
                scheduleInfo: r.activityId ? (scheduleMap.get(r.activityId) ?? null) : null,
            }
        })
    }
}
