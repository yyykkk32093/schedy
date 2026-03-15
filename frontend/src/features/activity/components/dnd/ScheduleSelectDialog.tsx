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
import { Calendar, CheckSquare, MapPin, Square } from 'lucide-react'
import { useState } from 'react'

interface ScheduleSelectDialogProps {
    open: boolean
    /** ドラッグ元日付のスケジュール一覧 */
    schedules: UserScheduleItem[]
    /** ドラッグ元の日付 "YYYY-MM-DD" */
    fromDate: string
    /** ドロップ先の日付 "YYYY-MM-DD" */
    toDate: string
    /** 選択確定時のコールバック（複数件） */
    onConfirm: (schedules: UserScheduleItem[]) => void
    /** キャンセル */
    onCancel: () => void
}

/**
 * ScheduleSelectDialog — 複数スケジュールのある日付セルを D&D した際に
 * どのスケジュールを操作するかチェックボックスで一括選択するダイアログ
 */
export function ScheduleSelectDialog({
    open,
    schedules,
    fromDate,
    toDate,
    onConfirm,
    onCancel,
}: ScheduleSelectDialogProps) {
    const fromLabel = format(parseISO(fromDate), 'M月d日(E)', { locale: ja })
    const toLabel = format(parseISO(toDate), 'M月d日(E)', { locale: ja })

    // 初期状態: 全選択
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set(schedules.map((s) => s.scheduleId)),
    )

    const allSelected = selectedIds.size === schedules.length
    const noneSelected = selectedIds.size === 0

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(schedules.map((s) => s.scheduleId)))
        }
    }

    const handleConfirm = () => {
        const selected = schedules.filter((s) => selectedIds.has(s.scheduleId))
        if (selected.length > 0) onConfirm(selected)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
            <DialogContent className="sm:max-w-[380px]">
                <DialogHeader>
                    <DialogTitle>スケジュールを選択</DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-gray-700">{fromLabel}</span> →{' '}
                        <span className="font-medium text-gray-700">{toLabel}</span>{' '}
                        へ操作するスケジュールを選んでください
                    </DialogDescription>
                </DialogHeader>

                {/* 全選択 / 全解除 */}
                <button
                    type="button"
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-1"
                >
                    {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                        <Square className="w-4 h-4" />
                    )}
                    {allSelected ? '全て解除' : '全て選択'}
                </button>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {schedules.map((s) => {
                        const checked = selectedIds.has(s.scheduleId)
                        return (
                            <label
                                key={s.scheduleId}
                                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${checked
                                        ? 'border-blue-300 bg-blue-50/50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleOne(s.scheduleId)}
                                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {s.activityTitle}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span>
                                            {s.startTime} 〜 {s.endTime}
                                        </span>
                                    </div>
                                    {s.location && (
                                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                            <span className="truncate">{s.location}</span>
                                        </div>
                                    )}
                                </div>
                            </label>
                        )
                    })}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onCancel}>
                        キャンセル
                    </Button>
                    <Button onClick={handleConfirm} disabled={noneSelected}>
                        {selectedIds.size}件を選択
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
