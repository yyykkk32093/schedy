import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'

/**
 * W3-13b: ビジター名サジェスト UseCase
 *
 * コミュニティ内で過去に使われたビジター名を重複なしで返す。
 * フロントエンドのオートコンプリートに利用。
 */
export class SuggestVisitorNamesUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
    ) { }

    async execute(input: {
        communityId: string
        query?: string
    }): Promise<{ names: string[] }> {
        const allNames = await this.participationRepository
            .findDistinctVisitorNamesByCommunityId(input.communityId)

        if (input.query && input.query.trim()) {
            const q = input.query.trim().toLowerCase()
            const filtered = allNames.filter((name) => name.toLowerCase().includes(q))
            return { names: filtered }
        }

        return { names: allNames }
    }
}
