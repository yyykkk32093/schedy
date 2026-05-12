import { http } from '@/shared/lib/apiClient'
import type { ListPollsResponse, PollOptionResult, PollResult } from '@/shared/types/api'

export type { PollOptionResult, PollResult }

export interface CreatePollRequest {
    question: string
    isMultipleChoice: boolean
    deadline: string | null
    options: string[]
    announcementId?: string | null
}

export interface CastVoteRequest {
    optionIds: string[]
}

// ─── API 関数 ────────────────────────────────────────────

export const pollApi = {
    create: (communityId: string, data: CreatePollRequest) =>
        http<{ pollId: string }>(`/v1/communities/${communityId}/polls`, { method: 'POST', json: data }),

    list: (communityId: string) =>
        http<ListPollsResponse>(`/v1/communities/${communityId}/polls`),

    getResult: (pollId: string) =>
        http<PollResult>(`/v1/polls/${pollId}`),

    vote: (pollId: string, data: CastVoteRequest) =>
        http<{ votedOptionIds: string[] }>(`/v1/polls/${pollId}/vote`, { method: 'POST', json: data }),

    remove: (pollId: string) =>
        http<void>(`/v1/polls/${pollId}`, { method: 'DELETE' }),
}
