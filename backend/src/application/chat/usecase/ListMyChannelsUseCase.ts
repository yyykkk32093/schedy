import type { IDMChannelRepository } from '@/domains/chat/domain/repository/IDMChannelRepository.js'
import type { Prisma } from '@prisma/client'

type PrismaLike = Pick<Prisma.TransactionClient, 'communityMembership' | 'chatChannel' | 'schedule'>

/** 最新メッセージ DTO */
interface LastMessage {
    id: string
    senderId: string
    content: string
    createdAt: string
}

/** Community チャンネル項目 */
interface CommunityChannelItem {
    channelId: string
    type: 'COMMUNITY'
    name: string
    avatarUrl: string | null
    communityId: string | null
    lastMessage: LastMessage | null
}

/** Activity チャンネル項目 */
interface ActivityChannelItem {
    channelId: string
    type: 'ACTIVITY'
    name: string
    subtitle: string
    communityName: string
    communityId: string | null
    activityId: string | null
    scheduleDate: string | null
    scheduleStartTime: string | null
    scheduleEndTime: string | null
    lastMessage: LastMessage | null
}

/** DM チャンネル項目 */
interface DMChannelItem {
    channelId: string
    type: 'DM'
    participants: string[]
    lastMessage: LastMessage | null
}

export interface ListMyChannelsResult {
    community: CommunityChannelItem[]
    activity: ActivityChannelItem[]
    dm: DMChannelItem[]
}

/**
 * 自分が参加する全チャンネル一覧 UseCase
 *
 * Community / Activity / DM の3セクションを集約して返す。
 * 各セクション内は最新メッセージの降順ソート。
 */
export class ListMyChannelsUseCase {
    constructor(
        private readonly db: PrismaLike,
        private readonly dmChannelRepo: IDMChannelRepository,
    ) { }

    async execute(userId: string): Promise<ListMyChannelsResult> {
        // ── 1. ユーザーが所属するコミュニティ ──
        const memberships = await this.db.communityMembership.findMany({
            where: { userId, leftAt: null },
            select: { communityId: true },
        })
        const communityIds = memberships.map((m) => m.communityId)

        // ── 2. Community チャンネル ──
        const communityChannels = communityIds.length > 0
            ? await this.db.chatChannel.findMany({
                where: { type: 'COMMUNITY', communityId: { in: communityIds } },
                include: {
                    community: { select: { id: true, name: true, logoUrl: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        where: { parentMessageId: null },
                    },
                },
            })
            : []

        // ── 3. Activity チャンネル ──
        const activityChannels = communityIds.length > 0
            ? await this.db.chatChannel.findMany({
                where: {
                    type: 'ACTIVITY',
                    activity: { communityId: { in: communityIds }, deletedAt: null },
                },
                include: {
                    activity: {
                        select: {
                            id: true,
                            title: true,
                            community: { select: { id: true, name: true } },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        where: { parentMessageId: null },
                    },
                },
            })
            : []

        // ── 3b. スケジュール情報 ──
        const activityIdsForChannels = activityChannels
            .map((ch) => ch.activityId)
            .filter((id): id is string => id !== null)

        const scheduleMap = new Map<string, { date: string; startTime: string; endTime: string }>()
        if (activityIdsForChannels.length > 0) {
            const now = new Date()
            const schedules = await this.db.schedule.findMany({
                where: { activityId: { in: activityIdsForChannels } },
                select: { activityId: true, date: true, startTime: true, endTime: true },
                orderBy: { date: 'asc' },
            })

            const grouped = new Map<string, typeof schedules>()
            for (const s of schedules) {
                const arr = grouped.get(s.activityId) ?? []
                arr.push(s)
                grouped.set(s.activityId, arr)
            }

            for (const [actId, items] of grouped) {
                const future = items.find((s) => s.date >= now)
                const picked = future ?? items[items.length - 1]
                if (picked) {
                    scheduleMap.set(actId, {
                        date: picked.date.toISOString().slice(0, 10),
                        startTime: picked.startTime,
                        endTime: picked.endTime,
                    })
                }
            }
        }

        // ── 4. DM チャンネル（リポジトリ経由） ──
        const dmChannelList = await this.dmChannelRepo.listByUserId(userId)

        // ── 5. レスポンス構築 ──
        const formatLastMessage = (
            messages: { id: string; senderId: string; content: string; createdAt: Date }[],
        ): LastMessage | null => {
            const m = messages[0]
            return m
                ? { id: m.id, senderId: m.senderId, content: m.content, createdAt: m.createdAt.toISOString() }
                : null
        }

        const sortByLatest = <T extends { lastMessage: LastMessage | null }>(items: T[]): T[] =>
            items.sort((a, b) => {
                const ta = a.lastMessage?.createdAt ?? ''
                const tb = b.lastMessage?.createdAt ?? ''
                return tb.localeCompare(ta)
            })

        const community: CommunityChannelItem[] = sortByLatest(
            communityChannels.map((ch) => ({
                channelId: ch.id,
                type: 'COMMUNITY' as const,
                name: ch.community?.name ?? '',
                avatarUrl: ch.community?.logoUrl ?? null,
                communityId: ch.communityId,
                lastMessage: formatLastMessage(ch.messages),
            })),
        )

        const activity: ActivityChannelItem[] = sortByLatest(
            activityChannels.map((ch) => {
                const sched = ch.activityId ? scheduleMap.get(ch.activityId) : undefined
                return {
                    channelId: ch.id,
                    type: 'ACTIVITY' as const,
                    name: ch.activity?.title ?? '',
                    subtitle: ch.activity?.community?.name ?? '',
                    communityName: ch.activity?.community?.name ?? '',
                    communityId: ch.activity?.community?.id ?? null,
                    activityId: ch.activityId,
                    scheduleDate: sched?.date ?? null,
                    scheduleStartTime: sched?.startTime ?? null,
                    scheduleEndTime: sched?.endTime ?? null,
                    lastMessage: formatLastMessage(ch.messages),
                }
            }),
        )

        const dm: DMChannelItem[] = sortByLatest(
            dmChannelList.map((d) => ({
                channelId: d.channelId,
                type: 'DM' as const,
                participants: d.participants,
                lastMessage: d.lastMessage
                    ? {
                        id: d.lastMessage.id,
                        senderId: d.lastMessage.senderId,
                        content: d.lastMessage.content,
                        createdAt: d.lastMessage.createdAt.toISOString(),
                    }
                    : null,
            })),
        )

        return { community, activity, dm }
    }
}
