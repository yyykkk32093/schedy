import { ScheduleCard } from '@/features/activity/components/ScheduleCard'
import type { UserScheduleItem } from '@/shared/types/api'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'

interface DraggableScheduleCardProps {
    schedule: UserScheduleItem
    /** true のとき日付を省略し時間のみ表示 */
    timeOnly?: boolean
}

/**
 * DraggableScheduleCard — ドラッグ可能な ScheduleCard
 *
 * 管理者のみが利用する想定。左端にドラッグハンドルを表示し、
 * カレンダーの日付セル（DroppableCalendarDay）へドロップ可能。
 */
export function DraggableScheduleCard({ schedule, timeOnly }: DraggableScheduleCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `schedule-${schedule.scheduleId}`,
        data: { schedule },
    })

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative flex items-stretch ${isDragging ? 'opacity-50 z-50' : ''}`}
        >
            {/* ドラッグハンドル */}
            <button
                {...listeners}
                {...attributes}
                type="button"
                className="flex items-center px-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
                aria-label="ドラッグして移動"
            >
                <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
                <ScheduleCard schedule={schedule} timeOnly={timeOnly} />
            </div>
        </div>
    )
}
