import { DMParticipantNotFoundError } from '@/domains/chat/domain/error/DMParticipantNotFoundError.js'
import type {
    DMChannelDTO,
    DMChannelListItem,
    IDMChannelRepository,
} from '@/domains/chat/domain/repository/IDMChannelRepository.js'
import type { Prisma } from '@prisma/client'

type PrismaLike = Pick<Prisma.TransactionClient, 'chatChannel' | 'dMParticipant'>

export class DMChannelRepositoryImpl implements IDMChannelRepository {
    constructor(private readonly db: PrismaLike) { }

    /**
     * 同一参加者セットの既存 DM チャンネルを効率的に検索。
     *
     * ロジック:
     * 1) participantIds のうち1人目の参加チャンネルを DM 型で取得
     * 2) 参加者セットが完全一致するものを絞り込み
     *
     * 従来の「全DMフルスキャン」を排除。
     */
    async findByParticipants(participantIds: string[]): Promise<DMChannelDTO | null> {
        const sorted = [...participantIds].sort()
        // 1人目のDM参加チャンネルを取得
        const candidates = await this.db.dMParticipant.findMany({
            where: { userId: sorted[0] },
            include: {
                channel: {
                    include: { dmParticipants: { select: { userId: true } } },
                },
            },
        })

        for (const c of candidates) {
            if (c.channel.type !== 'DM') continue
            const cPids = c.channel.dmParticipants.map((p) => p.userId).sort()
            if (cPids.length === sorted.length && cPids.every((id, i) => id === sorted[i])) {
                return {
                    channelId: c.channel.id,
                    participants: cPids,
                }
            }
        }
        return null
    }

    async create(participantIds: string[]): Promise<DMChannelDTO> {
        const channel = await this.db.chatChannel.create({
            data: {
                type: 'DM',
                dmParticipants: {
                    create: participantIds.map((uid) => ({ userId: uid })),
                },
            },
            include: { dmParticipants: { select: { userId: true } } },
        })
        return {
            channelId: channel.id,
            participants: channel.dmParticipants.map((p) => p.userId),
        }
    }

    async listByUserId(userId: string): Promise<DMChannelListItem[]> {
        const participations = await this.db.dMParticipant.findMany({
            where: { userId },
            include: {
                channel: {
                    include: {
                        dmParticipants: { select: { userId: true } },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            where: { parentMessageId: null },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        })

        return participations.map((p) => ({
            channelId: p.channel.id,
            participants: p.channel.dmParticipants.map((dp) => dp.userId),
            lastMessage: p.channel.messages[0]
                ? {
                    id: p.channel.messages[0].id,
                    senderId: p.channel.messages[0].senderId,
                    content: p.channel.messages[0].content,
                    createdAt: p.channel.messages[0].createdAt,
                }
                : null,
        }))
    }

    async removeParticipant(channelId: string, userId: string): Promise<void> {
        const participant = await this.db.dMParticipant.findFirst({
            where: { channelId, userId },
        })
        if (!participant) {
            throw new DMParticipantNotFoundError(channelId, userId)
        }
        await this.db.dMParticipant.delete({
            where: { id: participant.id },
        })
    }

    async isParticipant(channelId: string, userId: string): Promise<boolean> {
        const row = await this.db.dMParticipant.findFirst({
            where: { channelId, userId },
            select: { id: true },
        })
        return row !== null
    }
}
