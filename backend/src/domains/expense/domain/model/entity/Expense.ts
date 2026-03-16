import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'

/**
 * Expense — 支出エンティティ
 *
 * コミュニティの支出を記録する。
 * ExpenseCategory と紐付けて分類する。
 */
export class Expense extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly communityId: string,
        private categoryId: string,
        private amount: number,
        private description: string | null,
        private date: Date,
        private readonly createdBy: string,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: string
        communityId: string
        categoryId: string
        amount: number
        description?: string | null
        date: Date
        createdBy: string
    }): Expense {
        if (params.amount < 0) {
            throw new DomainValidationError('金額は0以上で入力してください', 'INVALID_EXPENSE_AMOUNT')
        }
        if (params.description && params.description.length > 200) {
            throw new DomainValidationError('説明は200文字以内で入力してください', 'EXPENSE_DESCRIPTION_TOO_LONG')
        }
        return new Expense(
            params.id,
            params.communityId,
            params.categoryId,
            params.amount,
            params.description?.trim() ?? null,
            params.date,
            params.createdBy,
            new Date(),
            new Date(),
        )
    }

    static reconstruct(params: {
        id: string
        communityId: string
        categoryId: string
        amount: number
        description: string | null
        date: Date
        createdBy: string
        createdAt: Date
        updatedAt: Date
    }): Expense {
        return new Expense(
            params.id,
            params.communityId,
            params.categoryId,
            params.amount,
            params.description,
            params.date,
            params.createdBy,
            params.createdAt,
            params.updatedAt,
        )
    }

    update(params: {
        categoryId?: string
        amount?: number
        description?: string | null
        date?: Date
    }): void {
        if (params.amount !== undefined && params.amount < 0) {
            throw new DomainValidationError('金額は0以上で入力してください', 'INVALID_EXPENSE_AMOUNT')
        }
        if (params.description !== undefined && params.description && params.description.length > 200) {
            throw new DomainValidationError('説明は200文字以内で入力してください', 'EXPENSE_DESCRIPTION_TOO_LONG')
        }
        if (params.categoryId !== undefined) this.categoryId = params.categoryId
        if (params.amount !== undefined) this.amount = params.amount
        if (params.description !== undefined) this.description = params.description?.trim() ?? null
        if (params.date !== undefined) this.date = params.date
        this.updatedAt = new Date()
    }

    // ---- Getters ----
    getId(): string { return this.id }
    getCommunityId(): string { return this.communityId }
    getCategoryId(): string { return this.categoryId }
    getAmount(): number { return this.amount }
    getDescription(): string | null { return this.description }
    getDate(): Date { return this.date }
    getCreatedBy(): string { return this.createdBy }
    getCreatedAt(): Date { return this.createdAt }
    getUpdatedAt(): Date { return this.updatedAt }
}
