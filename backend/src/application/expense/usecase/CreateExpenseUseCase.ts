import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import { Expense } from '@/domains/expense/domain/model/entity/Expense.js'
import type { IExpenseRepository } from '@/domains/expense/domain/repository/IExpenseRepository.js'

export type CreateExpenseTxRepositories = {
    expense: IExpenseRepository
    membership: ICommunityMembershipRepository
}

export class CreateExpenseUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateExpenseTxRepositories>,
    ) { }

    async execute(input: {
        communityId: string
        categoryId: string
        amount: number
        description?: string | null
        date: string // ISO date string
        userId: string
    }): Promise<{ expenseId: string }> {
        let expenseId = ''

        await this.unitOfWork.run(async (repos) => {
            // 権限チェック: OWNER / ADMIN のみ
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new Error('支出の登録はOWNERまたはADMINのみ実行できます')
            }

            const id = this.idGenerator.generate()
            const expense = Expense.create({
                id,
                communityId: input.communityId,
                categoryId: input.categoryId,
                amount: input.amount,
                description: input.description,
                date: new Date(input.date),
                createdBy: input.userId,
            })
            await repos.expense.add(expense)
            expenseId = id
        })

        return { expenseId }
    }
}
