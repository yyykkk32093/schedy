import { communityApi } from '@/features/community/api/communityApi'
import { Button } from '@/shared/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useMutation } from '@tanstack/react-query'
import { Banknote, BarChart3, ChevronDown, Copy, Mail, MessageCircle, Settings, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface ActionBarProps {
    communityId: string
    isAdminOrAbove: boolean
}

/**
 * ActionBar — 管理者向けアクションボタン群
 *
 * 招待 / 統計 / 集金管理 / 設定
 */
export function ActionBar({ communityId, isAdminOrAbove }: ActionBarProps) {
    const navigate = useNavigate()

    if (!isAdminOrAbove) return null

    return (
        <div className="flex items-center gap-1 flex-wrap">
            <InviteButton communityId={communityId} />

            <Link
                to={`/communities/${communityId}/analytics`}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
            >
                <BarChart3 className="w-3.5 h-3.5" />
                統計
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 outline-none">
                    <Banknote className="w-3.5 h-3.5" />
                    集金管理
                    <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => navigate(`/communities/${communityId}/refunds`)}>
                        返金一覧
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/communities/${communityId}/finance`)}>
                        収支確認
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Link
                to={`/communities/${communityId}/settings`}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
            >
                <Settings className="w-3.5 h-3.5" />
                設定
            </Link>
        </div>
    )
}

/**
 * InviteButton — トークン生成 + 共有モーダル（LINE / メール / クリップボード）
 */
function InviteButton({ communityId }: { communityId: string }) {
    const [isPending, setIsPending] = useState(false)
    const [shareLink, setShareLink] = useState<string | null>(null)
    const [showShareDialog, setShowShareDialog] = useState(false)

    const generateInvite = useMutation({
        mutationFn: () => communityApi.generateInviteToken(communityId),
        meta: { skipGlobalErrorHandler: true },
    })

    const handleInvite = async () => {
        setIsPending(true)
        try {
            const result = await generateInvite.mutateAsync()
            const link = `${window.location.origin}/invites/${result.token}/accept`
            setShareLink(link)
            setShowShareDialog(true)
        } catch {
            toast.error('招待リンクの生成に失敗しました')
        } finally {
            setIsPending(false)
        }
    }

    const handleCopy = async () => {
        if (!shareLink) return
        await navigator.clipboard.writeText(shareLink)
        toast.success('招待リンクをコピーしました')
        setShowShareDialog(false)
    }

    const handleLineShare = () => {
        if (!shareLink) return
        const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(`コミュニティに参加しませんか？\n${shareLink}`)}`
        window.open(lineUrl, '_blank')
        setShowShareDialog(false)
    }

    const handleMailShare = () => {
        if (!shareLink) return
        const subject = encodeURIComponent('コミュニティへの招待')
        const body = encodeURIComponent(`以下のリンクからコミュニティに参加できます:\n\n${shareLink}`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
        setShowShareDialog(false)
    }

    return (
        <>
            <button
                type="button"
                onClick={handleInvite}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
                <UserPlus className="w-3.5 h-3.5" />
                招待
            </button>

            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>メンバーを招待</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={handleLineShare}
                        >
                            <MessageCircle className="w-5 h-5 text-green-500" />
                            LINEで送る
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={handleMailShare}
                        >
                            <Mail className="w-5 h-5 text-blue-500" />
                            メールで送る
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={handleCopy}
                        >
                            <Copy className="w-5 h-5 text-gray-500" />
                            リンクをコピー
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
