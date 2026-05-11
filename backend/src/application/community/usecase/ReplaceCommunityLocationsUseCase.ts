import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import type { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { CommunityLocationDTO, CreateCommunityLocationInput, ICommunityLocationRepository } from '@/domains/community/domain/repository/ICommunityLocationRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { CommunityPermissionError } from '../error/CommunityPermissionError.js'

export type ReplaceCommunityLocationsTxRepositories = {
    membership: ICommunityMembershipRepository
    location: ICommunityLocationRepository
}

export type ReplaceCommunityLocationsInput = {
    communityId: string
    userId: string
    locations: Array<{
        id: string
        type: 'MAIN' | 'SUB'
        area: string
        station?: string | null
        sortOrder: number
    }>
}

/**
 * コミュニティの活動拠点を一括置換する。
 * OWNER/ADMIN のみ実行可能。MAIN は最大 1 件。
 */
export class ReplaceCommunityLocationsUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<ReplaceCommunityLocationsTxRepositories>,
    ) { }

    async execute(input: ReplaceCommunityLocationsInput): Promise<{ locations: CommunityLocationDTO[] }> {
        const mainCount = input.locations.filter((l) => l.type === 'MAIN').length
        if (mainCount > 1) {
            throw new HttpError({
                statusCode: 400,
                code: 'INVALID_REQUEST',
                message: 'MAIN は1件のみ設定可能です',
            })
        }

        return this.unitOfWork.run(async (repos) => {
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId,
                input.userId,
            )
            if (!membership || !membership.isActive()) {
                throw new CommunityPermissionError('コミュニティに所属していません')
            }
            const role = membership.getRole()
            if (!role.isOwner() && !role.isAdmin()) {
                throw new CommunityPermissionError('管理者以上の権限が必要です')
            }

            const inputs: CreateCommunityLocationInput[] = input.locations.map((loc) => ({
                id: loc.id,
                communityId: input.communityId,
                type: loc.type,
                area: loc.area,
                station: loc.station ?? null,
                sortOrder: loc.sortOrder,
            }))

            const locations = await repos.location.replaceAll(input.communityId, inputs)
            return { locations }
        })
    }
}
