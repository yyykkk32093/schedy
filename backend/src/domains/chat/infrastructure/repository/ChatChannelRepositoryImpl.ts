import type { Prisma, PrismaClient } from '@prisma/client'
import type {
    ChatChannelRow,
    IChatChannelRepository,
} from '../../domain/repository/IChatChannelRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ChatChannelRepositoryImpl implements IChatChannelRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(channelId: string): Promise<ChatChannelRow | null> {
        const row = await this.prisma.chatChannel.findUnique({ where: { id: channelId } })
        return row ? this.toRow(row) : null
    }

    async findByCommunityId(communityId: string): Promise<ChatChannelRow | null> {
        const row = await this.prisma.chatChannel.findUnique({ where: { communityId } })
        return row ? this.toRow(row) : null
    }

    async findByActivityId(activityId: string): Promise<ChatChannelRow | null> {
        const row = await this.prisma.chatChannel.findUnique({ where: { activityId } })
        return row ? this.toRow(row) : null
    }

    async createCommunityChannel(communityId: string): Promise<ChatChannelRow> {
        const row = await this.prisma.chatChannel.create({
            data: { type: 'COMMUNITY', communityId },
        })
        return this.toRow(row)
    }

    async createActivityChannel(activityId: string): Promise<ChatChannelRow> {
        const row = await this.prisma.chatChannel.create({
            data: { type: 'ACTIVITY', activityId },
        })
        return this.toRow(row)
    }

    private toRow(row: { id: string; type: string; communityId: string | null; activityId: string | null }): ChatChannelRow {
        return {
            id: row.id,
            type: row.type,
            communityId: row.communityId,
            activityId: row.activityId,
        }
    }
}
