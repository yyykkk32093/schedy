import type { CreatePollRequest } from '@/features/poll/api/pollApi'
import { pollApi } from '@/features/poll/api/pollApi'
import { pollKeys, pollListKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function usePolls(communityId: string) {
    return useQuery({
        queryKey: pollListKeys.byCommunity(communityId),
        queryFn: () => pollApi.list(communityId),
        enabled: !!communityId,
    })
}

export function usePollResult(pollId: string) {
    return useQuery({
        queryKey: pollKeys.detail(pollId),
        queryFn: () => pollApi.getResult(pollId),
        enabled: !!pollId,
    })
}

export function useCreatePoll(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreatePollRequest) => pollApi.create(communityId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: pollListKeys.byCommunity(communityId) }),
    })
}

export function useCastVote(pollId: string, communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (optionIds: string[]) => pollApi.vote(pollId, { optionIds }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: pollKeys.detail(pollId) })
            qc.invalidateQueries({ queryKey: pollListKeys.byCommunity(communityId) })
        },
    })
}

export function useDeletePoll(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: pollApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: pollListKeys.byCommunity(communityId) }),
    })
}
