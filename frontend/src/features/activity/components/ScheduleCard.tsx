import type { UserScheduleItem } from '@/shared/types/api'
import { formatDateLabel } from '@/shared/utils/dateGroup'
import { Banknote, Calendar, Globe, MapPin, Trash2, User, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ScheduleCardProps {
    schedule: UserScheduleItem
    /** true のとき日付を省略し時間のみ表示（タイムラインの日付グルーピング内で使用） */
    timeOnly?: boolean
    /** 参加取り消しコールバック。渡された場合ゴミ箱アイコンを表示 */
    onRemove?: (scheduleId: string) => void
}

/**
 * ScheduleCard — アクティビティのスケジュール1件を表示するカード
 *
 * タップで /activities/:activityId へ遷移
 * カレンダータブ・タイムラインタブ・コミュニティ詳細のアクティビティタブで共通利用
 */
export function ScheduleCard({ schedule, timeOnly, onRemove }: ScheduleCardProps) {
    const navigate = useNavigate()

    const title = schedule.communityName
        ? `${schedule.communityName}：${schedule.activityTitle}`
        : schedule.activityTitle

    return (
        <button
            onClick={() => navigate(`/activities/${schedule.activityId}?schedule=${schedule.scheduleId}`)}
            className="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-xs text-blue-600 font-medium truncate">
                            {title}
                        </p>
                        {schedule.isOnline && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 shrink-0">
                                <Globe className="w-2.5 h-2.5" />
                                オンライン
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {timeOnly ? (
                            <span>{schedule.startTime} 〜 {schedule.endTime}</span>
                        ) : (
                            <span>
                                日時：{formatDateLabel(schedule.date)} {schedule.startTime} 〜 {schedule.endTime}
                            </span>
                        )}
                    </div>
                    {schedule.location && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>場所：{schedule.location}</span>
                        </div>
                    )}
                    {schedule.isOnline && schedule.meetingUrl && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-sm text-blue-500">
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">会議URL：{schedule.meetingUrl}</span>
                        </div>
                    )}
                    {/* 幹事名・参加費・参加人数（データがあれば表示） */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {schedule.organizerName && (
                            <span className="flex items-center gap-0.5">
                                <User className="w-3 h-3" />
                                {schedule.organizerName}
                            </span>
                        )}
                        {schedule.participationFee != null && (
                            <span className="flex items-center gap-0.5">
                                <Banknote className="w-3 h-3" />
                                {schedule.participationFee > 0 ? `¥${schedule.participationFee.toLocaleString()}` : '無料'}
                            </span>
                        )}
                        {schedule.participantCount != null && (
                            <span className="flex items-center gap-0.5">
                                <Users className="w-3 h-3" />
                                {schedule.participantCount}{schedule.capacity != null ? `/${schedule.capacity}` : ''}名
                            </span>
                        )}
                    </div>
                </div>
                {onRemove && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemove(schedule.scheduleId) }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-1"
                        aria-label="参加取り消し"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </button>
    )
}
