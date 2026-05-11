export type CategoryMasterDto = {
    id: string
    name: string
    nameEn: string | null
    sortOrder: number
}

export type ParticipationLevelMasterDto = {
    id: string
    name: string
    nameEn: string | null
    sortOrder: number
}

export interface IMasterRepository {
    /** カテゴリマスタ一覧（sortOrder 昇順） */
    findCategories(): Promise<CategoryMasterDto[]>
    /** 参加レベルマスタ一覧（sortOrder 昇順） */
    findParticipationLevels(): Promise<ParticipationLevelMasterDto[]>
}
