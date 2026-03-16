import type { IExpenseCategoryRepository } from '@/domains/expense/domain/repository/IExpenseCategoryRepository.js'

export class ListExpenseCategoriesUseCase {
    constructor(
        private readonly categoryRepository: IExpenseCategoryRepository,
    ) { }

    async execute(input: { communityId: string }): Promise<{
        categories: Array<{
            id: string
            name: string
            isSystem: boolean
            sortOrder: number
        }>
    }> {
        const categories = await this.categoryRepository.findsByCommunityId(input.communityId)

        return {
            categories: categories.map((c) => ({
                id: c.getId(),
                name: c.getName(),
                isSystem: c.getIsSystem(),
                sortOrder: c.getSortOrder(),
            })),
        }
    }
}
