import { http } from '@/shared/lib/apiClient';
import type {
    AbsenceReportResponse,
    CommunityStatsResponse,
    ParticipationTrendResponse,
} from '@/shared/types/api';

/**
 * analyticsApi — 統計・分析 API クライアント（Phase 4）
 */
export const analyticsApi = {
    /** UBL-17: コミュニティ統計 */
    stats: (communityId: string) =>
        http<CommunityStatsResponse>(
            `/v1/communities/${communityId}/analytics/stats`,
        ),

    /** UBL-19: 参加者推移 */
    trend: (communityId: string, from?: string, to?: string) =>
        http<ParticipationTrendResponse>(
            `/v1/communities/${communityId}/analytics/trend`,
            { query: { from, to } },
        ),

    /** UBL-18: 欠席・キャンセル分析 */
    absences: (communityId: string, from?: string, to?: string) =>
        http<AbsenceReportResponse>(
            `/v1/communities/${communityId}/analytics/absences`,
            { query: { from, to } },
        ),
}

/**
 * exportApi — データ出力 API クライアント（Phase 4）
 */
export const exportApi = {
    /** UBL-20: 参加状況 CSV */
    participationCsv: (communityId: string, params?: { activityId?: string; from?: string; to?: string }) =>
        fetchBlob(`/v1/communities/${communityId}/export/participation-csv`, params),

    /** UBL-21: 会計情報出力 */
    accounting: (communityId: string, params?: { format?: 'csv' | 'pdf'; from?: string; to?: string }) =>
        fetchBlob(`/v1/communities/${communityId}/export/accounting`, params),

    /** UBL-22: カレンダーエクスポート */
    calendarIcal: (params?: { from?: string; to?: string }) =>
        fetchBlob('/v1/users/me/export/calendar.ics', params),
}

// ── Blob ダウンロード用ヘルパー ──

async function fetchBlob(
    path: string,
    params?: Record<string, string | undefined>,
): Promise<{ blob: Blob; filename: string }> {
    const baseURL = import.meta.env.VITE_API_BASE_URL || ''
    let url = baseURL + path

    if (params) {
        const sp = new URLSearchParams()
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined) sp.append(k, v)
        }
        const qs = sp.toString()
        if (qs) url += `?${qs}`
    }

    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
        throw new Error(`Export failed: ${res.status}`)
    }

    const contentDisposition = res.headers.get('Content-Disposition') ?? ''
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    const filename = filenameMatch?.[1] ?? 'download'

    const blob = await res.blob()
    return { blob, filename }
}
