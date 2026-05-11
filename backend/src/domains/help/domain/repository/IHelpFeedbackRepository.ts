export type HelpFeedbackUpsertInput = {
    userId: string
    articleSlug: string
    categorySlug: string
    helpful: boolean
    comment: string | null
}

export type HelpFeedbackCreateInput = {
    articleSlug: string
    categorySlug: string
    helpful: boolean
    comment: string | null
}

export type HelpFeedbackSummaryGroup = {
    categorySlug: string
    articleSlug: string
    helpful: boolean
    count: number
    lastCreatedAt: Date | null
}

export type HelpFeedbackExportRow = {
    articleSlug: string
    categorySlug: string
    helpful: boolean
    comment: string | null
    userId: string | null
    createdAt: Date
    updatedAt: Date
}

export interface IHelpFeedbackRepository {
    upsertByUser(input: HelpFeedbackUpsertInput): Promise<void>
    createAnonymous(input: HelpFeedbackCreateInput): Promise<void>
    groupBySummary(): Promise<HelpFeedbackSummaryGroup[]>
    findAllForExport(): Promise<HelpFeedbackExportRow[]>
}
