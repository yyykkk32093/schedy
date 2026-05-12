import { http } from '@/shared/lib/apiClient'
import type {
    AdminInquiryDetailResponse,
    AdminInquirySummaryDto,
    InquiryAttachmentDto,
    InquiryCategoryDto,
    InquiryDetailDto,
    InquiryMessageDto,
    InquirySummaryDto,
    ListAdminInquiriesResponse,
    ListInquiryCategoriesResponse,
    ListSystemAdminsResponse,
    SystemAdminUserDto,
} from '@/shared/types/api'

export type {
    AdminInquirySummaryDto, InquiryAttachmentDto, InquiryCategoryDto, InquiryDetailDto, InquiryMessageDto,
    InquirySummaryDto, SystemAdminUserDto
}

export interface CreateInquiryInput {
    categorySlug: string
    title: string
    body: string
    attachmentKeys?: Array<{
        storageKey: string
        fileName: string
        mimeType: string
        sizeBytes: number
    }>
}

export interface CreateAnonymousInquiryInput extends CreateInquiryInput {
    contactEmail: string
    recaptchaToken: string
}

export const inquiryApi = {
    listCategories: (includeAnonymous = false) =>
        http<ListInquiryCategoriesResponse>('/v1/inquiries/categories', {
            query: { includeAnonymous: includeAnonymous ? 'true' : undefined },
        }),

    create: (input: CreateInquiryInput) =>
        http<InquiryDetailDto>('/v1/inquiries', { method: 'POST', json: input }),

    createAnonymous: (input: CreateAnonymousInquiryInput) =>
        http<{ id: string }>('/v1/inquiries/anonymous', { method: 'POST', json: input }),

    listMine: () =>
        http<{ inquiries: InquirySummaryDto[] }>('/v1/inquiries'),

    findMineById: (id: string) =>
        http<InquiryDetailDto>(`/v1/inquiries/${id}`),

    addMyMessage: (
        id: string,
        input: { body: string; attachmentKeys?: CreateInquiryInput['attachmentKeys'] },
    ) =>
        http<InquiryMessageDto>(`/v1/inquiries/${id}/messages`, {
            method: 'POST',
            json: input,
        }),

    // ── 運営側 ──
    admin: {
        list: (filter?: { status?: string; category?: string; assignee?: 'me' | 'unassigned' }) =>
            http<ListAdminInquiriesResponse>('/v1/admin/inquiries', {
                query: filter as Record<string, string | undefined>,
            }),

        findById: (id: string) =>
            http<AdminInquiryDetailResponse>(`/v1/admin/inquiries/${id}`),

        updateStatus: (id: string, status: InquirySummaryDto['status']) =>
            http<{ id: string; status: string; resolvedAt: string | null }>(
                `/v1/admin/inquiries/${id}/status`,
                { method: 'PATCH', json: { status } },
            ),

        addOperatorMessage: (
            id: string,
            input: { body: string; attachmentKeys?: CreateInquiryInput['attachmentKeys'] },
        ) =>
            http<InquiryMessageDto>(`/v1/admin/inquiries/${id}/messages`, {
                method: 'POST',
                json: input,
            }),

        // Wave6 Phase 9b-16: 担当オペレーター設定/解除
        updateAssignee: (id: string, assigneeUserId: string | null) =>
            http<{ id: string; assignee: AdminInquirySummaryDto['assignee'] }>(
                `/v1/admin/inquiries/${id}/assignee`,
                { method: 'PATCH', json: { assigneeUserId } },
            ),

        listSystemAdmins: () =>
            http<ListSystemAdminsResponse>('/v1/admin/system-admins'),
    },
}

export const inquiryQueryKeys = {
    all: ['inquiries'] as const,
    categories: () => ['inquiries', 'categories'] as const,
    mine: () => ['inquiries', 'mine'] as const,
    detail: (id: string) => ['inquiries', 'detail', id] as const,
    adminList: (filter?: object) => ['inquiries', 'admin', 'list', filter] as const,
    adminDetail: (id: string) => ['inquiries', 'admin', 'detail', id] as const,
}
