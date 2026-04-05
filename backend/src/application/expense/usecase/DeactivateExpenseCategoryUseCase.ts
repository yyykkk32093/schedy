import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { IExpenseCategoryRepository } from '@/domains/expense/domain/repository/IExpenseCategoryRepository.js'
import type { IExpenseRepository } from '@/domains/expense/domain/repository/IExpenseRepository.js'

export type DeactivateExpenseCategoryTxRepositories = {
    category: IExpenseCategoryRepository
    expense: IExpenseRepository
    membership: ICommunityMembershipRepository
}

/**
 * カスタムカテゴリを無効化し、紐づく支出を「未分類」カテゴリに振り替える
 *
 * - isSystem=true のシステムカテゴリは無効化不可（ドメイン層で拒否）
 * - 支出の振り替えは Prisma updateMany による直接バルク更新（B案）
 */
export class DeactivateExpenseCategoryUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<DeactivateExpenseCategoryTxRepositories>,
    ) { }

    async execute(input: {
        categoryId: string
        communityId: string
        userId: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            // 権限チェック: OWNER / ADMIN のみ
            const membership = await repos.membership.findByCommunityAndUser(
                input.communityId, input.userId,
            )
            if (!membership || !membership.isActive() || !membership.getRole().canManageMembers()) {
                throw new Error('カテゴリの削除はOWNERまたはADMINのみ実行できます')
            }

            const category = await repos.category.findById(input.categoryId)
            if (!category) {
                throw new Error('カテゴリが見つかりません')
            }

            // 「未分類」システムカテゴリを特定
            const allCategories = await repos.category.findsByCommunityId(input.communityId)
            const uncategorized = allCategories.find(
                (c) => c.getName() === '未分類' && c.getIsSystem(),
            )
            if (!uncategorized) {
                throw new Error('未分類カテゴリが見つかりません。システムカテゴリが正しくセットアップされていることを確認してください。')
            }

            // 支出を「未分類」に振り替え（バルク更新）
            await repos.expense.reassignCategory(input.categoryId, uncategorized.getId())

            // カテゴリを無効化
            category.deactivate()
            await repos.category.update(category)
        })
    }
}
