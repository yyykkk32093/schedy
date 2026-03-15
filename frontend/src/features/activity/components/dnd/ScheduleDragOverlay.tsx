import type { UserScheduleItem } from '@/shared/types/api'
import { Calendar, MapPin } from 'lucide-react'

interface ScheduleDragOverlayProps {
    schedule: UserScheduleItem
}

/**
 * ScheduleDragOverlay — ドラッグ中にカーソルに追随するプレビューカード
 */
export function ScheduleDragOverlay({ schedule }: ScheduleDragOverlayProps) {
    return (
        <div className="w-56 rounded-lg border bg-white p-3 shadow-lg ring-2 ring-blue-400/50">
            <p className="text-xs text-blue-600 font-medium truncate">
                {schedule.activityTitle}
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-700">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>{schedule.startTime} 〜 {schedule.endTime}</span>
            </div>
            {schedule.location && (
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{schedule.location}</span>
                </div>
            )}
        </div>
    )
}
