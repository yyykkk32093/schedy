import type { UserScheduleItem } from '@/shared/types/api'
import { Calendar, MapPin, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ScheduleCardProps {
    schedule: UserScheduleItem
}

/** 日付文字列 (YYYY-MM-DD) を M月D日(曜) に変換 */
function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`
}

/**
 * ScheduleCard — アクティビティのスケジュール1件を表示するカード
 *
 * タップで /activities/:activityId へ遷移
 * カレンダータブ・タイムラインタブ・コミュニティ詳細のアクティビティタブで共通利用
 */
export function ScheduleCard({ schedule }: ScheduleCardProps) {
    const navigate = useNavigate()

    return (
        <button
            onClick={() => navigate(`/activities/${schedule.activityId}`)}
            className="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-600 font-medium truncate">
                        {schedule.communityName}：{schedule.activityTitle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                            日時：{formatDateLabel(schedule.date)} {schedule.startTime} 〜 {schedule.endTime}
                        </span>
                    </div>
                    {schedule.location && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>場所：{schedule.location}</span>
                        </div>
                    )}
                </div>
                <X className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </div>
        </button>
    )
}
