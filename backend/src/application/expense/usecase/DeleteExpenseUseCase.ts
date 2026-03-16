import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IExpenseRepository } from '@/domains/expense/domain/repository/IExpenseRepository.js'

export type DeleteExpenseTxRepositories = {
    expense: IExpenseRepository
    membership: ICommunityMembershipRepository
}

export class DeleteExpenseUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<DeleteExpenseTxRepositories>,
    ) { }

    async execute(input: {
        expenseId: string
        communityId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new Error('支出の削除はOWNERまたはADMINのみ実行できます')
            }

            const expense = await repos.expense.findById(input.expenseId)
            if (!expense) {
                throw new Error('支出が見つかりません')
            }
            if (expense.getCommunityId() !== input.communityId) {
                throw new Error('この支出は指定されたコミュニティのものではありません')
            }

            await repos.expense.delete(input.expenseId)
        })
    }
}
