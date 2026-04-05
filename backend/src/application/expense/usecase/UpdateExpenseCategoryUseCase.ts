import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IExpenseCategoryRepository } from '@/domains/expense/domain/repository/IExpenseCategoryRepository.js'

export type UpdateExpenseCategoryTxRepositories = {
    category: IExpenseCategoryRepository
    membership: ICommunityMembershipRepository
}

export class UpdateExpenseCategoryUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateExpenseCategoryTxRepositories>,
    ) { }

    async execute(input: {
        categoryId: string
        communityId: string
        name: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            // 権限チェック: OWNER / ADMIN のみ
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId,
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new Error('カテゴリの変更はOWNERまたはADMINのみ実行できます')
            }

            const category = await repos.category.findById(input.categoryId)
            if (!category) {
                throw new Error('カテゴリが見つかりません')
            }

            category.rename(input.name)
            await repos.category.update(category)
        })
    }
}
