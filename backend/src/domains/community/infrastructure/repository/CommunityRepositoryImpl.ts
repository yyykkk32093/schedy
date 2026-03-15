import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import type { Prisma, PrismaClient, Community as PrismaCommunity } from '@prisma/client'
import { Community } from '../../domain/model/entity/Community.js'
import { CommunityDescription } from '../../domain/model/valueObject/CommunityDescription.js'
import { CommunityGrade } from '../../domain/model/valueObject/CommunityGrade.js'
import { CommunityId } from '../../domain/model/valueObject/CommunityId.js'
import { CommunityName } from '../../domain/model/valueObject/CommunityName.js'
import { JoinMethod } from '../../domain/model/valueObject/JoinMethod.js'
import type { CommunityDetail, CommunityListItem, ICommunityRepository, PublicCommunitySearchItem, SearchCommunitiesParams } from '../../domain/repository/ICommunityRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class CommunityRepositoryImpl implements ICommunityRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Community | null> {
        const row = await this.prisma.community.findFirst({
            where: { id, deletedAt: null },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByCreatedBy(createdBy: string): Promise<Community[]> {
        const rows = await this.prisma.community.findMany({
            where: { createdBy, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async save(community: Community): Promise<void> {
        await this.prisma.community.upsert({
            where: { id: community.getId().getValue() },
            create: {
                id: community.getId().getValue(),
                name: community.getName().getValue(),
                description: community.getDescription()?.getValue() ?? null,
                logoUrl: community.getLogoUrl(),
                coverUrl: community.getCoverUrl(),
                parentId: community.getParentId()?.getValue() ?? null,
                depth: community.getDepth(),
                grade: community.getGrade().getValue(),
                createdBy: community.getCreatedBy().getValue(),
                deletedAt: community.getDeletedAt(),
                communityTypeId: community.getCommunityTypeId(),
                joinMethod: community.getJoinMethod().getValue(),
                isPublic: community.getIsPublic(),
                maxMembers: community.getMaxMembers(),
                mainActivityArea: community.getMainActivityArea(),
                activityFrequency: community.getActivityFrequency(),
                nearestStation: community.getNearestStation(),
                targetGender: community.getTargetGender(),
                ageRange: community.getAgeRange(),
                payPayId: community.getPayPayId(),
                enabledPaymentMethods: community.getEnabledPaymentMethods(),
                stripeAccountId: community.getStripeAccountId(),
                reminderEnabled: community.getReminderEnabled(),
                cancellationAlertEnabled: community.getCancellationAlertEnabled(),
            },
            update: {
                name: community.getName().getValue(),
                description: community.getDescription()?.getValue() ?? null,
                logoUrl: community.getLogoUrl(),
                coverUrl: community.getCoverUrl(),
                grade: community.getGrade().getValue(),
                deletedAt: community.getDeletedAt(),
                communityTypeId: community.getCommunityTypeId(),
                joinMethod: community.getJoinMethod().getValue(),
                isPublic: community.getIsPublic(),
                maxMembers: community.getMaxMembers(),
                mainActivityArea: community.getMainActivityArea(),
                activityFrequency: community.getActivityFrequency(),
                nearestStation: community.getNearestStation(),
                targetGender: community.getTargetGender(),
                ageRange: community.getAgeRange(),
                payPayId: community.getPayPayId(),
                enabledPaymentMethods: community.getEnabledPaymentMethods(),
                stripeAccountId: community.getStripeAccountId(),
                reminderEnabled: community.getReminderEnabled(),
                cancellationAlertEnabled: community.getCancellationAlertEnabled(),
            },
        })
    }

    private toDomain(row: PrismaCommunity): Community {
        return Community.reconstruct({
            id: CommunityId.reconstruct(row.id),
            name: CommunityName.reconstruct(row.name),
            description: row.description ? CommunityDescription.reconstruct(row.description) : null,
            logoUrl: row.logoUrl,
            coverUrl: row.coverUrl,
            parentId: row.parentId ? CommunityId.reconstruct(row.parentId) : null,
            depth: row.depth,
            grade: CommunityGrade.reconstruct(row.grade),
            createdBy: UserId.create(row.createdBy),
            deletedAt: row.deletedAt,
            communityTypeId: row.communityTypeId,
            joinMethod: JoinMethod.reconstruct(row.joinMethod),
            isPublic: row.isPublic,
            maxMembers: row.maxMembers,
            mainActivityArea: row.mainActivityArea,
            activityFrequency: row.activityFrequency,
            nearestStation: row.nearestStation,
            targetGender: row.targetGender,
            ageRange: row.ageRange,
            payPayId: row.payPayId,
            enabledPaymentMethods: row.enabledPaymentMethods,
            stripeAccountId: row.stripeAccountId,
            reminderEnabled: row.reminderEnabled,
            cancellationAlertEnabled: row.cancellationAlertEnabled,
        })
    }

    async findListByMemberUserId(userId: string): Promise<CommunityListItem[]> {
        const memberships = await this.prisma.communityMembership.findMany({
            where: { userId, leftAt: null },
            include: {
                community: {
                    include: {
                        announcements: {
                            where: { deletedAt: null },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: { title: true, createdAt: true },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        })

        return memberships
            .filter((m) => m.community && m.community.deletedAt === null)
            .map((m) => {
                const c = m.community
                const latestAnn = c.announcements[0] ?? null
                return {
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    logoUrl: c.logoUrl,
                    coverUrl: c.coverUrl,
                    grade: c.grade,
                    role: m.role,
                    createdBy: c.createdBy,
                    communityTypeId: c.communityTypeId,
                    joinMethod: c.joinMethod,
                    isPublic: c.isPublic,
                    maxMembers: c.maxMembers,
                    mainActivityArea: c.mainActivityArea,
                    latestAnnouncementTitle: latestAnn?.title ?? null,
                    latestAnnouncementAt: latestAnn?.createdAt ?? null,
                }
            })
    }

    async findDetailById(id: string): Promise<CommunityDetail | null> {
        const row = await this.prisma.community.findFirst({
            where: { id, deletedAt: null },
            include: {
                categories: {
                    include: { category: { select: { id: true, name: true, nameEn: true } } },
                },
                participationLevels: {
                    include: { level: { select: { id: true, name: true, nameEn: true } } },
                },
                activityDays: { select: { day: true } },
                tags: { select: { tag: true } },
                _count: { select: { memberships: { where: { leftAt: null } } } },
            },
        })
        if (!row) return null

        return {
            id: row.id,
            name: row.name,
            description: row.description,
            logoUrl: row.logoUrl,
            coverUrl: row.coverUrl,
            grade: row.grade,
            createdBy: row.createdBy,
            communityTypeId: row.communityTypeId,
            joinMethod: row.joinMethod,
            isPublic: row.isPublic,
            maxMembers: row.maxMembers,
            mainActivityArea: row.mainActivityArea,
            activityFrequency: row.activityFrequency,
            nearestStation: row.nearestStation,
            targetGender: row.targetGender,
            ageRange: row.ageRange,
            payPayId: row.payPayId,
            enabledPaymentMethods: row.enabledPaymentMethods,
            stripeAccountId: row.stripeAccountId,
            categories: row.categories.map((c) => ({
                id: c.category.id,
                name: c.category.name,
                nameEn: c.category.nameEn,
            })),
            participationLevels: row.participationLevels.map((l) => ({
                id: l.level.id,
                name: l.level.name,
                nameEn: l.level.nameEn,
            })),
            activityDays: row.activityDays.map((d) => d.day),
            tags: row.tags.map((t) => t.tag),
            memberCount: row._count.memberships,
        }
    }

    async searchPublic(params: SearchCommunitiesParams): Promise<{ items: PublicCommunitySearchItem[]; total: number }> {
        const { keyword, categoryIds, levelIds, area, days, limit = 20, offset = 0 } = params

        // AND 条件を組み立て
        const where: Prisma.CommunityWhereInput = {
            isPublic: true,
            deletedAt: null,
        }

        // キーワード: name OR description に含まれる (contains/LIKE)
        if (keyword) {
            where.OR = [
                { name: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
            ]
        }

        // エリア: mainActivityArea に含まれる
        if (area) {
            where.mainActivityArea = { contains: area, mode: 'insensitive' }
        }

        // カテゴリ: OR（同フィルタ内はOR）
        if (categoryIds && categoryIds.length > 0) {
            where.categories = { some: { categoryId: { in: categoryIds } } }
        }

        // 参加レベル: OR
        if (levelIds && levelIds.length > 0) {
            where.participationLevels = { some: { levelId: { in: levelIds } } }
        }

        // 活動曜日: OR
        if (days && days.length > 0) {
            where.activityDays = { some: { day: { in: days } } }
        }

        const [rows, total] = await Promise.all([
            this.prisma.community.findMany({
                where,
                include: {
                    categories: {
                        include: { category: { select: { id: true, name: true } } },
                    },
                    participationLevels: {
                        include: { level: { select: { id: true, name: true } } },
                    },
                    _count: { select: { memberships: { where: { leftAt: null } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.community.count({ where }),
        ])

        const items: PublicCommunitySearchItem[] = rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            logoUrl: r.logoUrl,
            mainActivityArea: r.mainActivityArea,
            joinMethod: r.joinMethod,
            memberCount: r._count.memberships,
            categories: r.categories.map((c) => ({ id: c.category.id, name: c.category.name })),
            participationLevels: r.participationLevels.map((l) => ({ id: l.level.id, name: l.level.name })),
        }))

        return { items, total }
    }

    async findPublicDetailById(id: string): Promise<CommunityDetail | null> {
        const row = await this.prisma.community.findFirst({
            where: { id, deletedAt: null, isPublic: true },
            include: {
                categories: {
                    include: { category: { select: { id: true, name: true, nameEn: true } } },
                },
                participationLevels: {
                    include: { level: { select: { id: true, name: true, nameEn: true } } },
                },
                activityDays: { select: { day: true } },
                tags: { select: { tag: true } },
                _count: { select: { memberships: { where: { leftAt: null } } } },
            },
        })
        if (!row) return null

        return {
            id: row.id,
            name: row.name,
            description: row.description,
            logoUrl: row.logoUrl,
            coverUrl: row.coverUrl,
            grade: row.grade,
            createdBy: row.createdBy,
            communityTypeId: row.communityTypeId,
            joinMethod: row.joinMethod,
            isPublic: row.isPublic,
            maxMembers: row.maxMembers,
            mainActivityArea: row.mainActivityArea,
            activityFrequency: row.activityFrequency,
            nearestStation: row.nearestStation,
            targetGender: row.targetGender,
            ageRange: row.ageRange,
            payPayId: row.payPayId,
            enabledPaymentMethods: row.enabledPaymentMethods,
            stripeAccountId: row.stripeAccountId,
            categories: row.categories.map((c) => ({
                id: c.category.id,
                name: c.category.name,
                nameEn: c.category.nameEn,
            })),
            participationLevels: row.participationLevels.map((l) => ({
                id: l.level.id,
                name: l.level.name,
                nameEn: l.level.nameEn,
            })),
            activityDays: row.activityDays.map((d) => d.day),
            tags: row.tags.map((t) => t.tag),
            memberCount: row._count.memberships,
        }
    }
}
