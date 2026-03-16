import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

interface FabAction {
    icon: ReactNode
    onClick: () => void
    label: string
}

interface SingleFabProps {
    /** FAB表示モード: 単一ボタン */
    variant?: 'single'
    /** アクション定義（1件） */
    actions: [FabAction]
    /** 表示/非表示制御 */
    visible?: boolean
    /** 追加クラス */
    className?: string
}

interface SplitFabProps {
    /** FAB表示モード: 左右分割 */
    variant: 'split'
    /** アクション定義（2件: [左, 右]） */
    actions: [FabAction, FabAction]
    /** 表示/非表示制御 */
    visible?: boolean
    /** 追加クラス */
    className?: string
}

type FloatingActionButtonProps = SingleFabProps | SplitFabProps

/**
 * FloatingActionButton — 共通FABコンポーネント
 *
 * - `variant='single'`: 従来型の1ボタンFAB（CommunityDetailPage等）
 * - `variant='split'`:  左右分割FAB（CommunityListPage #52用）
 *
 * 位置・サイズ・z-indexを統一: `fixed bottom-20 right-4 z-40`
 */
export function FloatingActionButton({ variant = 'single', actions, visible = true, className }: FloatingActionButtonProps) {
    if (!visible) return null

    if (variant === 'split') {
        const [left, right] = actions as [FabAction, FabAction]
        return (
            <div className={cn('fixed bottom-20 right-4 z-40 flex overflow-hidden rounded-full bg-white shadow-xl ring-1 ring-gray-200', className)}>
                <button
                    type="button"
                    onClick={left.onClick}
                    aria-label={left.label}
                    className="flex h-14 w-14 items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                >
                    {left.icon}
                </button>
                <div className="w-px self-stretch bg-gray-200" />
                <button
                    type="button"
                    onClick={right.onClick}
                    aria-label={right.label}
                    className="flex h-14 w-14 items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                >
                    {right.icon}
                </button>
            </div>
        )
    }

    // single variant
    const [action] = actions as [FabAction]
    return (
        <button
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            className={cn(
                'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:opacity-80 active:scale-95 transition-all',
                className,
            )}
        >
            {action.icon}
        </button>
    )
}
