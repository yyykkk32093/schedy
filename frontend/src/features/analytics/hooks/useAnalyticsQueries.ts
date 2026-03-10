import { analyticsKeys } from '@/shared/lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, exportApi } from '../api/analyticsApi'

/**
 * useCommunityStats — コミュニティ統計（UBL-17）
 */
export function useCommunityStats(communityId: string) {
    return useQuery({
        queryKey: analyticsKeys.stats(communityId),
        queryFn: () => analyticsApi.stats(communityId),
        enabled: !!communityId,
    })
}

/**
 * useParticipationTrend — 参加者推移（UBL-19）
 */
export function useParticipationTrend(communityId: string) {
    return useQuery({
        queryKey: analyticsKeys.trend(communityId),
        queryFn: () => analyticsApi.trend(communityId),
        enabled: !!communityId,
    })
}

/**
 * useAbsenceReport — 欠席・キャンセル分析（UBL-18）
 */
export function useAbsenceReport(communityId: string) {
    return useQuery({
        queryKey: analyticsKeys.absences(communityId),
        queryFn: () => analyticsApi.absences(communityId),
        enabled: !!communityId,
    })
}

// ── エクスポートヘルパー ──

/**
 * ファイルをダウンロードするヘルパー
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * useExportParticipationCsv — 参加状況 CSV ダウンロード（UBL-20）
 */
export function useExportParticipationCsv() {
    return async (communityId: string, params?: { activityId?: string; from?: string; to?: string }) => {
        const { blob, filename } = await exportApi.participationCsv(communityId, params)
        downloadBlob(blob, filename)
    }
}

/**
 * useExportAccounting — 会計情報ダウンロード（UBL-21）
 */
export function useExportAccounting() {
    return async (
        communityId: string,
        params?: { format?: 'csv' | 'pdf'; from?: string; to?: string },
    ) => {
        const { blob, filename } = await exportApi.accounting(communityId, params)
        downloadBlob(blob, filename)
    }
}

/**
 * useExportCalendar — カレンダーエクスポート（UBL-22）
 */
export function useExportCalendar() {
    return async (params?: { from?: string; to?: string }) => {
        const { blob, filename } = await exportApi.calendarIcal(params)
        downloadBlob(blob, filename)
    }
}
