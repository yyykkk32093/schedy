import { useCalendarSchedules } from '@/features/activity/components/dnd/CalendarDndContext'
import { cn } from '@/shared/lib/utils'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { format } from 'date-fns'
import { useCallback, type HTMLAttributes } from 'react'
import type { CalendarDay, Modifiers } from 'react-day-picker'

/**
 * DroppableCalendarDay — react-day-picker の Day（<td>）をオーバーライド
 *
 * 1. useDroppable: すべての日付セルがドロップターゲット
 * 2. useDraggable: スケジュールがある日付セルのみドラッグ可能
 *    - PointerSensor (distance: 8) でクリックとドラッグを判別
 *    - 日付タップ（選択）は内部の DayButton で処理されるため干渉しない
 */
export function DroppableCalendarDay(
    props: { day: CalendarDay; modifiers: Modifiers } & HTMLAttributes<HTMLDivElement>,
) {
    const { day, modifiers, className, ...tdProps } = props
    const dateStr = format(day.date, 'yyyy-MM-dd')
    const schedules = useCalendarSchedules(dateStr)
    const hasDraggableSchedules = schedules.length > 0

    /* ── ドロップターゲット ── */
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `calendar-day-${dateStr}`,
        data: { date: dateStr },
    })

    /* ── ドラッグソース（スケジュールのある日付のみ） ── */
    const { setNodeRef: setDragRef, listeners, isDragging } = useDraggable({
        id: `date-cell-${dateStr}`,
        data: { type: 'date-cell', date: dateStr, schedules },
        disabled: !hasDraggableSchedules,
    })

    /* ── ref を統合 ── */
    const setNodeRef = useCallback(
        (node: HTMLElement | null) => {
            setDropRef(node)
            setDragRef(node)
        },
        [setDropRef, setDragRef],
    )

    return (
        <td
            ref={setNodeRef as React.Ref<HTMLTableCellElement>}
            className={cn(
                className,
                isOver && 'ring-2 ring-inset ring-blue-400 bg-blue-100/50 rounded-md',
                isDragging && 'opacity-40',
            )}
            {...(tdProps as React.TdHTMLAttributes<HTMLTableCellElement>)}
            {...(hasDraggableSchedules ? listeners : {})}
        />
    )
}
