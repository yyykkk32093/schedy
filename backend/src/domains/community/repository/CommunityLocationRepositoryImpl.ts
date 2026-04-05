/**
 * CommunityLocationRepositoryImpl
 *
 * Prisma を使った ICommunityLocationRepository の実装。
 */
import type {
    CommunityLocationDTO,
    CreateCommunityLocationInput,
    ICommunityLocationRepository,
    UpdateCommunityLocationInput,
} from '@/domains/community/repository/ICommunityLocationRepository.js'
import type { Prisma, PrismaClient } from '@prisma/client'

export class CommunityLocationRepositoryImpl implements ICommunityLocationRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient,
    ) { }

    async findByCommunityId(communityId: string): Promise<CommunityLocationDTO[]> {
        const rows = await this.db.communityLocation.findMany({
            where: { communityId },
            orderBy: { sortOrder: 'asc' },
        })
        return rows.map(this.toDTO)
    }

    async findById(id: string): Promise<CommunityLocationDTO | null> {
        const row = await this.db.communityLocation.findUnique({ where: { id } })
        return row ? this.toDTO(row) : null
    }

    async create(input: CreateCommunityLocationInput): Promise<CommunityLocationDTO> {
        const row = await this.db.communityLocation.create({
            data: {
                id: input.id,
                communityId: input.communityId,
                type: input.type,
                area: input.area,
                station: input.station ?? null,
                sortOrder: input.sortOrder,
            },
        })
        return this.toDTO(row)
    }

    async update(id: string, input: UpdateCommunityLocationInput): Promise<CommunityLocationDTO> {
        const row = await this.db.communityLocation.update({
            where: { id },
            data: {
                ...(input.type !== undefined && { type: input.type }),
                ...(input.area !== undefined && { area: input.area }),
                ...(input.station !== undefined && { station: input.station }),
                ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
            },
        })
        return this.toDTO(row)
    }

    async delete(id: string): Promise<void> {
        await this.db.communityLocation.delete({ where: { id } })
    }

    async deleteAllByCommunityId(communityId: string): Promise<void> {
        await this.db.communityLocation.deleteMany({ where: { communityId } })
    }

    async replaceAll(
        communityId: string,
        locations: CreateCommunityLocationInput[],
    ): Promise<CommunityLocationDTO[]> {
        // deleteMany + createMany in same call context (caller should wrap in TX if needed)
        await this.db.communityLocation.deleteMany({ where: { communityId } })

        if (locations.length === 0) return []

        await this.db.communityLocation.createMany({
            data: locations.map((loc) => ({
                id: loc.id,
                communityId: loc.communityId,
                type: loc.type,
                area: loc.area,
                station: loc.station ?? null,
                sortOrder: loc.sortOrder,
            })),
        })

        return this.findByCommunityId(communityId)
    }

    private toDTO(row: {
        id: string
        communityId: string
        type: string
        area: string
        station: string | null
        sortOrder: number
        createdAt: Date
        updatedAt: Date
    }): CommunityLocationDTO {
        return {
            id: row.id,
            communityId: row.communityId,
            type: row.type as 'MAIN' | 'SUB',
            area: row.area,
            station: row.station,
            sortOrder: row.sortOrder,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
