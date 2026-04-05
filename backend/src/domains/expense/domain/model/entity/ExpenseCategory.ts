import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'

/**
 * ExpenseCategory — 支出カテゴリマスタ
 *
 * - isSystem=true のプリセットカテゴリはシステム管理
 * - isSystem=false はコミュニティごとのカスタムカテゴリ（将来対応）
 */
export class ExpenseCategory extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly communityId: string | null,
        private name: string,
        private readonly isSystem: boolean,
        private sortOrder: number,
        private isActive: boolean,
        private readonly createdAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: string
        communityId?: string | null
        name: string
        isSystem?: boolean
        sortOrder?: number
    }): ExpenseCategory {
        if (!params.name || params.name.trim() === '') {
            throw new DomainValidationError('カテゴリ名は必須です', 'INVALID_CATEGORY_NAME')
        }
        if (params.name.length > 50) {
            throw new DomainValidationError('カテゴリ名は50文字以内で入力してください', 'CATEGORY_NAME_TOO_LONG')
        }
        return new ExpenseCategory(
            params.id,
            params.communityId ?? null,
            params.name.trim(),
            params.isSystem ?? false,
            params.sortOrder ?? 0,
            true,
            new Date(),
        )
    }

    static reconstruct(params: {
        id: string
        communityId: string | null
        name: string
        isSystem: boolean
        sortOrder: number
        isActive: boolean
        createdAt: Date
    }): ExpenseCategory {
        return new ExpenseCategory(
            params.id,
            params.communityId,
            params.name,
            params.isSystem,
            params.sortOrder,
            params.isActive,
            params.createdAt,
        )
    }

    // ---- Getters ----
    getId(): string { return this.id }
    getCommunityId(): string | null { return this.communityId }
    getName(): string { return this.name }
    getIsSystem(): boolean { return this.isSystem }
    getSortOrder(): number { return this.sortOrder }
    getIsActive(): boolean { return this.isActive }
    getCreatedAt(): Date { return this.createdAt }

    // ---- Commands ----
    rename(newName: string): void {
        if (this.isSystem) {
            throw new DomainValidationError('システムカテゴリは名前を変更できません', 'CANNOT_RENAME_SYSTEM_CATEGORY')
        }
        if (!newName || newName.trim() === '') {
            throw new DomainValidationError('カテゴリ名は必須です', 'INVALID_CATEGORY_NAME')
        }
        if (newName.length > 50) {
            throw new DomainValidationError('カテゴリ名は50文字以内で入力してください', 'CATEGORY_NAME_TOO_LONG')
        }
        this.name = newName.trim()
    }

    deactivate(): void {
        if (this.isSystem) {
            throw new DomainValidationError('システムカテゴリは無効化できません', 'CANNOT_DEACTIVATE_SYSTEM_CATEGORY')
        }
        this.isActive = false
    }
}
