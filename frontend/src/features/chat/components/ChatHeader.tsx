import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { LogOut, MoreVertical, Search } from 'lucide-react'
import { useState } from 'react'

interface ChatHeaderProps {
    /** 相手の名前 or チャンネル名 */
    name: string
    /** アバターURL */
    avatarUrl?: string | null
    /** サブテキスト（アクティブ状態など） */
    subtitle?: string
    /** タイトルタップ時のコールバック（コミュニティ/アクティビティ詳細へ遷移等） */
    onTitlePress?: () => void
    /** 検索アイコンクリック時のコールバック */
    onSearchToggle?: () => void
    /** チャンネル退出コールバック（指定時のみメニューを表示） */
    onLeave?: () => void
}

/**
 * チャット画面ヘッダー — Mockup準拠
 * アバター + 名前 + アクティブ状態 + 検索アイコン + メニュー
 */
export function ChatHeader({ name, avatarUrl, subtitle, onTitlePress, onSearchToggle, onLeave }: ChatHeaderProps) {
    const [showLeaveDialog, setShowLeaveDialog] = useState(false)

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <div
                className={`flex items-center gap-3 min-w-0 ${onTitlePress ? 'cursor-pointer' : ''}`}
                onClick={onTitlePress}
                role={onTitlePress ? 'button' : undefined}
            >
                <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                    <AvatarFallback className="text-sm bg-gray-200">
                        {name.slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className={`text-sm font-bold text-gray-900 truncate ${onTitlePress ? 'hover:underline' : ''}`}>{name}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onSearchToggle}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    aria-label="メッセージを検索"
                >
                    <Search className="h-5 w-5" />
                </button>

                {onLeave && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="p-2 text-gray-600 hover:text-gray-900"
                                aria-label="メニュー"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setShowLeaveDialog(true)}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                チャットを退出
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* 退出確認ダイアログ */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>チャットを退出</DialogTitle>
                        <DialogDescription>
                            このチャットから退出しますか？メッセージ履歴は閲覧できなくなります。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">キャンセル</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowLeaveDialog(false)
                                onLeave?.()
                            }}
                        >
                            退出する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
