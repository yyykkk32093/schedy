/**
 * Inquiry リポジトリインターフェース
 *
 * NOTE (Phase 2 暫定): Wave6 Phase 8-B では Controller から Prisma 直呼び
 * していたが、DDD レイヤルール準拠のため薄い Repository を用意した。
 * バックログ I-11 で正式な UseCase / Domain Model 分離を実施する。
 */

export type InquiryCategoryMasterRow = {
    id: string
    slug: string
    labelI18n: unknown
    relatedHelpCategorySlug: string | null
    isAnonymousOnly: boolean
    isActive: boolean
}

export type InquiryAttachmentRow = {
    id: string
    fileName: string
    mimeType: string
    sizeBytes: number
    scanStatus: string
}

export type InquiryMessageRow = {
    id: string
    authorType: string
    body: string
    createdAt: Date
    attachments: InquiryAttachmentRow[]
}

export type InquiryWithRelations = {
    id: string
    title: string
    status: string
    lastActivityAt: Date
    createdAt: Date
    contactEmail: string | null
    category: { slug: string; labelI18n: unknown }
    user: { id: string; displayName: string | null; email: string | null } | null
    assignee: { id: string; displayName: string | null; email: string | null } | null
    messages?: InquiryMessageRow[]
}

export type CreateAttachmentInput = {
    storageKey: string
    fileName: string
    mimeType: string
    sizeBytes: number
}

export type CreateAnonymousInquiryInput = {
    contactEmail: string
    categoryId: string
    title: string
    body: string
    attachments: CreateAttachmentInput[]
}

export type ListInquiriesFilter = {
    status?: string
    categorySlug?: string
    assigneeUserId?: string | null // null = unassigned filter, undefined = no filter
    assigneeFilterMode: 'me' | 'unassigned' | 'all'
}

export type AddOperatorMessageResult = {
    message: {
        id: string
        authorType: string
        body: string
        createdAt: Date
        attachments: InquiryAttachmentRow[]
    }
    inquiry: { id: string; userId: string | null; title: string }
}

export interface IInquiryRepository {
    findCategoryBySlug(slug: string): Promise<InquiryCategoryMasterRow | null>

    listCategories(opts: { includeAnonymous: boolean }): Promise<Array<{
        id: string
        slug: string
        labelI18n: unknown
        relatedHelpCategorySlug: string | null
        isAnonymousOnly: boolean
    }>>

    createAnonymousInquiry(input: CreateAnonymousInquiryInput): Promise<{ id: string }>

    listAdmin(filter: ListInquiriesFilter): Promise<InquiryWithRelations[]>

    findByIdAdmin(id: string): Promise<InquiryWithRelations | null>

    updateStatus(
        id: string,
        status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    ): Promise<{ id: string; status: string; resolvedAt: Date | null }>

    findCoreById(id: string): Promise<{ id: string; userId: string | null; status: string; title: string } | null>

    /**
     * 運営返信メッセージを追加し、必要なら OPEN→IN_PROGRESS に遷移、lastActivityAt を更新する（トランザクション）。
     */
    addOperatorMessage(input: {
        inquiryId: string
        operatorUserId: string
        body: string
        attachments: CreateAttachmentInput[]
    }): Promise<AddOperatorMessageResult>

    updateAssignee(
        id: string,
        assigneeUserId: string | null,
    ): Promise<{
        id: string
        assignee: { id: string; displayName: string | null; email: string | null } | null
    }>
}
