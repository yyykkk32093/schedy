import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { ExpenseCategory } from '@/domains/expense/domain/model/entity/ExpenseCategory.js'
import type { IExpenseCategoryRepository } from '@/domains/expense/domain/repository/IExpenseCategoryRepository.js'

export type CreateExpenseCategoryTxRepositories = {
    category: IExpenseCategoryRepository
    membership: ICommunityMembershipRepository
}

export class CreateExpenseCategoryUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateExpenseCategoryTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        name: string
        userId: string
    }): Promise<{ categoryId: string }> {
        let categoryId = ''

        await this.unitOfWork.run(async (repos) => {
            // 権限チェック: OWNER / ADMIN のみ
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId,
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new Error('カテゴリの作成はOWNERまたはADMINのみ実行できます')
            }

            const id = this.idGenerator.generate()
            const category = ExpenseCategory.create({
                id,
                communityId: input.communityId,
                name: input.name,
                isSystem: false,
            })
            await repos.category.add(category)
            categoryId = id
        })

        return { categoryId }
    }
}
