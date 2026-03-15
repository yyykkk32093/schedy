import { useAuth } from '@/app/providers/AuthProvider'
import { communityApi } from '@/features/community/api/communityApi'
import { activityKeys, communityKeys, communitySearchKeys, masterKeys, memberKeys } from '@/shared/lib/queryKeys'
import type { SearchCommunitiesParams } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

export function useCommunities() {
    return useQuery({
        queryKey: communityKeys.all,
        queryFn: () => communityApi.list(),
    })
}

export function useCommunity(id: string) {
    return useQuery({
        queryKey: communityKeys.detail(id),
        queryFn: () => communityApi.findById(id),
        enabled: !!id,
    })
}

export function useCreateCommunity() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: communityApi.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: communityKeys.all }),
    })
}

export function useUpdateCommunity(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof communityApi.update>[1]) => communityApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: communityKeys.all })
            qc.invalidateQueries({ queryKey: communityKeys.detail(id) })
            // コミュニティの支払い設定がアクティビティ詳細にネストされているため、
            // アクティビティキャッシュも無効化する
            qc.invalidateQueries({ queryKey: activityKeys.all })
        },
    })
}

export function useDeleteCommunity() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: communityApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: communityKeys.all }),
    })
}

export function useMembers(communityId: string) {
    return useQuery({
        queryKey: memberKeys.list(communityId),
        queryFn: () => communityApi.listMembers(communityId),
        enabled: !!communityId,
    })
}

/**
 * useMyRole — 現ユーザーのコミュニティ内ロールを返す
 *
 * useMembers から member 一覧を取得し、useAuth の userId と突合して
 * 現ユーザーの role を導出する。
 */
export function useMyRole(communityId: string) {
    const { user } = useAuth()
    const { data: membersData, isLoading } = useMembers(communityId)

    return useMemo(() => {
        if (isLoading || !membersData?.members || !user?.userId) {
            return { role: null, isAdminOrAbove: false, isLoading }
        }
        const myMember = membersData.members.find((m) => m.userId === user.userId)
        const role = myMember?.role ?? null
        const isAdminOrAbove = role === 'OWNER' || role === 'ADMIN'
        return { role, isAdminOrAbove, isLoading: false }
    }, [membersData, user?.userId, isLoading])
}

export function useAddMember(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Parameters<typeof communityApi.addMember>[1]) => communityApi.addMember(communityId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.list(communityId) }),
    })
}

export function useLeaveCommunity() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: communityApi.leave,
        onSuccess: () => qc.invalidateQueries({ queryKey: communityKeys.all }),
    })
}

export function useCommunityMasters() {
    return useQuery({
        queryKey: masterKeys.community(),
        queryFn: () => communityApi.getAllMasters(),
        staleTime: 1000 * 60 * 60, // マスタデータは1時間キャッシュ
    })
}

// ---- Phase 2.5: 検索・参加 ----

export function useSearchCommunities(params: SearchCommunitiesParams, enabled = true) {
    return useQuery({
        queryKey: communitySearchKeys.list(params as Record<string, unknown>),
        queryFn: () => communityApi.search(params),
        enabled,
    })
}

export function usePublicCommunityDetail(id: string) {
    return useQuery({
        queryKey: communitySearchKeys.publicDetail(id),
        queryFn: () => communityApi.findPublicById(id),
        enabled: !!id,
    })
}

export function useJoinCommunity() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: communityApi.join,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: communityKeys.all })
            qc.invalidateQueries({ queryKey: communitySearchKeys.all })
        },
    })
}

export function useJoinRequest() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ communityId, message }: { communityId: string; message?: string }) =>
            communityApi.requestJoin(communityId, message ? { message } : undefined),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: communitySearchKeys.all })
        },
    })
}
