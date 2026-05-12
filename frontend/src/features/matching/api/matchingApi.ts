import { http } from '@/shared/lib/apiClient'
import type {
    ListCategoryMatchFormatsResponse,
    ListParticipantLevelsResponse,
    MatchingMode,
    MatchingParticipant,
    MatchingResult,
    MatchingRound,
} from '@/shared/types/api'

export type { MatchingMode, MatchingParticipant, MatchingResult, MatchingRound }

export interface GenerateMatchingRequest {
    mode: MatchingMode
    rounds?: number
    courtCount: number
    groupsPerCourt: number
    playersPerGroup: number
    categoryId?: string | null
    categoryName?: string | null
    formatName?: string | null
    fixedPairs?: Array<[string, string]>
}

export const matchingApi = {
    getBySchedule: (scheduleId: string) =>
        http<MatchingResult>(`/v1/schedules/${scheduleId}/matching`),

    generate: (scheduleId: string, data: GenerateMatchingRequest) =>
        http<{ matchingResultId: string }>(`/v1/schedules/${scheduleId}/matching`, {
            method: 'POST',
            json: data,
        }),

    appendRounds: (scheduleId: string, addRounds: number) =>
        http<{ matchingResultId: string }>(`/v1/schedules/${scheduleId}/matching/append-rounds`, {
            method: 'POST',
            json: { addRounds },
        }),

    removeBySchedule: (scheduleId: string) =>
        http<void>(`/v1/schedules/${scheduleId}/matching`, { method: 'DELETE' }),

    updateFixedPairs: (scheduleId: string, fixedPairs: Array<[string, string]>) =>
        http<void>(`/v1/schedules/${scheduleId}/matching/fixed-pairs`, {
            method: 'PATCH',
            json: { fixedPairs },
        }),

    updateRound: (
        scheduleId: string,
        roundNo: number,
        courts: Array<{ courtNo: number; groups: Array<{ groupNo: number; participantIds: string[] }> }>,
    ) =>
        http<void>(`/v1/schedules/${scheduleId}/matching/rounds/${roundNo}`, {
            method: 'PATCH',
            json: { courts },
        }),

    listCategoryMatchFormats: (communityId: string) =>
        http<ListCategoryMatchFormatsResponse>(`/v1/communities/${communityId}/category-match-formats`),

    listParticipantLevels: (scheduleId: string) =>
        http<ListParticipantLevelsResponse>(`/v1/schedules/${scheduleId}/matching/participant-levels`),

    updateMemberLevel: (communityId: string, userId: string, level: number | null) =>
        http<void>(`/v1/communities/${communityId}/members/${userId}/level`, {
            method: 'PATCH',
            json: { level },
        }),

    updateVisitorLevel: (participationId: string, level: number | null) =>
        http<void>(`/v1/participations/${participationId}/visitor-level`, {
            method: 'PATCH',
            json: { level },
        }),
}
