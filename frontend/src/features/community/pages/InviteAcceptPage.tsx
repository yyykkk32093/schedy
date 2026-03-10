import { useAuth } from '@/app/providers/AuthProvider'
import { communityApi } from '@/features/community/api/communityApi'
import { Button } from '@/shared/components/ui/button'
import { communityKeys } from '@/shared/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function InviteAcceptPage() {
    const { token } = useParams<{ token: string }>()
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const navigate = useNavigate()
    const qc = useQueryClient()

    const acceptMutation = useMutation({
        mutationFn: () => communityApi.acceptInvite(token!),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: communityKeys.all })
            // 3秒後にコミュニティ詳細へ遷移
            setTimeout(() => {
                navigate(`/communities/${data.communityId}`, { replace: true })
            }, 2000)
        },
    })

    useEffect(() => {
        // 未認証なら login に飛ばす（ログイン後にここに戻る）
        if (!authLoading && !isAuthenticated) {
            navigate(`/login?redirect=/invites/${token}/accept`, { replace: true })
        }
    }, [authLoading, isAuthenticated, navigate, token])

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
            {acceptMutation.isIdle && (
                <>
                    <p className="text-center text-gray-600">招待リンクからコミュニティに参加しますか？</p>
                    <Button onClick={() => acceptMutation.mutate()} size="lg" className="w-full max-w-xs">
                        参加する
                    </Button>
                </>
            )}

            {acceptMutation.isPending && (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-sm text-gray-500">参加処理中...</p>
                </div>
            )}

            {acceptMutation.isSuccess && (
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="text-green-500" size={48} />
                    <p className="text-lg font-medium">参加完了！</p>
                    <p className="text-sm text-gray-500">コミュニティページへ移動します...</p>
                </div>
            )}

            {acceptMutation.isError && (
                <div className="flex flex-col items-center gap-2">
                    <XCircle className="text-red-500" size={48} />
                    <p className="text-lg font-medium">参加できませんでした</p>
                    <p className="text-sm text-red-500">
                        {(acceptMutation.error as Error)?.message ?? '不明なエラーが発生しました'}
                    </p>
                    <Button variant="outline" onClick={() => navigate('/', { replace: true })}>
                        ホームに戻る
                    </Button>
                </div>
            )}
        </div>
    )
}
