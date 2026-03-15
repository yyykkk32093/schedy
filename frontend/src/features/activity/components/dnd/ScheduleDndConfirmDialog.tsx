import { Button } from '@/shared/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import type { UserScheduleItem } from '@/shared/types/api'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Copy, MoveRight, X } from 'lucide-react'

export type DndAction = 'copy' | 'move' | 'cancel'

interface ScheduleDndConfirmDialogProps {
    open: boolean
    /** 操作対象のスケジュール（1件 or 複数件） */
    schedules: UserScheduleItem[]
    /** ドロップ先の日付 "YYYY-MM-DD" */
    toDate: string
    /** 処理中フラグ */
    isLoading?: boolean
    onAction: (action: DndAction) => void
}

/**
 * ScheduleDndConfirmDialog — D&D 操作後の確認ダイアログ
 *
 * 3つの選択肢:
 * - コピー: 同じ内容のスケジュールを新しい日付に作成
 * - 移動: 既存スケジュールの日付を変更
 * - キャンセル: 何もしない
 *
 * 1件の場合はタイトル表示、複数件の場合は件数表示。
 */
export function ScheduleDndConfirmDialog({
    open,
    schedules,
    toDate,
    isLoading = false,
    onAction,
}: ScheduleDndConfirmDialogProps) {
    if (schedules.length === 0) return null

    const fromDate = schedules[0].date
    const fromLabel = format(parseISO(fromDate), 'M月d日(E)', { locale: ja })
    const toLabel = format(parseISO(toDate), 'M月d日(E)', { locale: ja })

    const targetLabel =
        schedules.length === 1
            ? `「${schedules[0].activityTitle}」`
            : `${schedules.length}件のスケジュール`

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onAction('cancel')}>
            <DialogContent className="sm:max-w-[360px]">
                <DialogHeader>
                    <DialogTitle>スケジュールの操作</DialogTitle>
                    <DialogDescription>
                        {targetLabel}を{' '}
                        <span className="font-medium text-gray-700">{fromLabel}</span> から{' '}
                        <span className="font-medium text-gray-700">{toLabel}</span>{' '}
                        へ移動またはコピーしますか？
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 mt-2">
                    <Button
                        onClick={() => onAction('copy')}
                        disabled={isLoading}
                        variant="outline"
                        className="justify-start gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        コピーして作成
                    </Button>
                    <Button
                        onClick={() => onAction('move')}
                        disabled={isLoading}
                        variant="outline"
                        className="justify-start gap-2"
                    >
                        <MoveRight className="w-4 h-4" />
                        移動する
                    </Button>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        onClick={() => onAction('cancel')}
                        disabled={isLoading}
                        variant="ghost"
                        className="gap-2"
                    >
                        <X className="w-4 h-4" />
                        キャンセル
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
