import type { Prisma, PrismaClient } from '@prisma/client'
import type {
    CategoryMasterDto,
    IMasterRepository,
    ParticipationLevelMasterDto,
} from '../../domain/repository/IMasterRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class MasterRepositoryImpl implements IMasterRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async findCategories(): Promise<CategoryMasterDto[]> {
        return this.db.categoryMaster.findMany({
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, nameEn: true, sortOrder: true },
        })
    }

    async findParticipationLevels(): Promise<ParticipationLevelMasterDto[]> {
        return this.db.participationLevelMaster.findMany({
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, nameEn: true, sortOrder: true },
        })
    }
}
