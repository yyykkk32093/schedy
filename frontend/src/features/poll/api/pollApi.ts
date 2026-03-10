import { http } from '@/shared/lib/apiClient'

// ─── 型定義 ──────────────────────────────────────────────

export interface PollOptionResult {
    id: string
    text: string
    sortOrder: number
    voteCount: number
    voters: Array<{ userId: string; displayName: string | null; avatarUrl: string | null }>
}

export interface PollResult {
    id: string
    communityId: string
    announcementId: string | null
    question: string
    isMultipleChoice: boolean
    deadline: string | null
    createdBy: string
    createdAt: string
    options: PollOptionResult[]
    totalVotes: number
    myVotedOptionIds: string[]
}

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
        http<PollResult[]>(`/v1/communities/${communityId}/polls`),

    getResult: (pollId: string) =>
        http<PollResult>(`/v1/polls/${pollId}`),

    vote: (pollId: string, data: CastVoteRequest) =>
        http<{ votedOptionIds: string[] }>(`/v1/polls/${pollId}/vote`, { method: 'POST', json: data }),

    remove: (pollId: string) =>
        http<void>(`/v1/polls/${pollId}`, { method: 'DELETE' }),
}
