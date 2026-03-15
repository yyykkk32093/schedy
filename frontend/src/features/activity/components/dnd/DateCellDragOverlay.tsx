import { parseISO } from 'date-fns'

interface DateCellDragOverlayProps {
    /** ドラッグ元の日付 "YYYY-MM-DD" */
    date: string
}

/**
 * DateCellDragOverlay — ドラッグ中にカーソルに追随するカレンダーセル風プレビュー
 *
 * カレンダー上の日付セルと同じ見た目（日付番号のみ）で表示する。
 */
export function DateCellDragOverlay({ date }: DateCellDragOverlayProps) {
    const dayNum = parseISO(date).getDate()

    return (
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white border-2 border-blue-400 shadow-lg text-sm font-semibold text-gray-800">
            {dayNum}
        </div>
    )
}
