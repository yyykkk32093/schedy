import { ScheduleCard } from '@/features/activity/components/ScheduleCard'
import { useActivities } from '@/features/activity/hooks/useActivityQueries'
import { Calendar } from '@/shared/components/ui/calendar'
import { Input } from '@/shared/components/ui/input'
import { http } from '@/shared/lib/apiClient'
import type { ListSchedulesResponse, UserScheduleItem } from '@/shared/types/api'
import { useQuery } from '@tanstack/react-query'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * ActivitiesTab — コミュニティ詳細のアクティビティタブ
 *
 * サブタブ: カレンダー / タイムライン
 * - カレンダー: 月間ビュー + ドット表示 + 日付タップで一覧
 * - タイムライン: 検索バー + アクティビティ/スケジュールリスト + 作成FAB
 */
export function ActivitiesTab() {
    const { id: communityId } = useParams<{ id: string }>()
    const [subTab, setSubTab] = useState<'timeline' | 'calendar'>('timeline')

    return (
        <div className="py-2">
            {/* Sub-tab switcher */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setSubTab('timeline')}
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === 'timeline'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    タイムライン
                </button>
                <button
                    onClick={() => setSubTab('calendar')}
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === 'calendar'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    カレンダー
                </button>
            </div>

            {subTab === 'timeline' ? (
                <TimelineSubTab communityId={communityId!} />
            ) : (
                <CalendarSubTab communityId={communityId!} />
            )}
        </div>
    )
}

// ─── コミュニティ単位のスケジュール横断取得 Hook ──────────

function useCommunitySchedules(communityId: string, from: string, to: string) {
    const { data: activitiesData } = useActivities(communityId)
    const activities = activitiesData?.activities ?? []
    const activityIds = activities.map((a) => a.id)

    return useQuery({
        queryKey: ['community-schedules', communityId, from, to, activityIds],
        queryFn: async (): Promise<UserScheduleItem[]> => {
            if (activities.length === 0) return []

            const results = await Promise.all(
                activities.map(async (activity) => {
                    const res = await http<ListSchedulesResponse>(
                        `/v1/activities/${activity.id}/schedules`
                    )
                    return res.schedules
                        .filter((s) => s.date >= from && s.date <= to)
                        .map((s) => ({
                            scheduleId: s.id,
                            date: s.date,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            location: s.location,
                            status: s.status,
                            participationFee: s.participationFee,
                            activityId: activity.id,
                            activityTitle: activity.title,
                            communityId: activity.communityId,
                            communityName: '', // コミュニティ名はコンテキストで既知
                        }))
                })
            )

            return results
                .flat()
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
        },
        enabled: activities.length > 0,
    })
}

// ─── Timeline Sub-Tab ────────────────────────────────────

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const weekDays = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getMonth() + 1}月${d.getDate()}日(${weekDays[d.getDay()]})`
}

function TimelineSubTab({ communityId }: { communityId: string }) {
    const navigate = useNavigate()
    const { data: activitiesData, isLoading } = useActivities(communityId)
    const [search, setSearch] = useState('')

    // 検索 + upcomingSchedules[0].date でソート
    const sortedActivities = useMemo(() => {
        const all = activitiesData?.activities ?? []
        const filtered = search.trim()
            ? all.filter((a) => {
                const q = search.toLowerCase()
                return (
                    a.title.toLowerCase().includes(q) ||
                    (a.defaultLocation?.toLowerCase().includes(q) ?? false)
                )
            })
            : all

        // upcoming がある = 日付昇順、ない = 末尾
        return [...filtered].sort((a, b) => {
            const aDate = a.upcomingSchedules?.[0]?.date ?? 'z'
            const bDate = b.upcomingSchedules?.[0]?.date ?? 'z'
            return aDate.localeCompare(bDate)
        })
    }, [activitiesData, search])

    return (
        <div className="relative">
            <div className="px-4 py-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="pl-9"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="py-8 text-center text-gray-400 text-sm">読み込み中...</div>
            ) : sortedActivities.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {sortedActivities.map((a, idx) => {
                        const nextDate = a.upcomingSchedules?.[0]?.date
                        const curMonth = nextDate?.slice(0, 7) ?? null
                        const prevMonth = idx > 0
                            ? (sortedActivities[idx - 1].upcomingSchedules?.[0]?.date?.slice(0, 7) ?? null)
                            : null

                        const showMonthHeader = curMonth && curMonth !== prevMonth
                        const [y, m] = curMonth ? curMonth.split('-') : ['', '']

                        return (
                            <div key={a.id}>
                                {showMonthHeader && (
                                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                                        {y}年{Number(m)}月
                                    </div>
                                )}
                                <button
                                    onClick={() => navigate(`/activities/${a.id}`)}
                                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                    {a.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{a.description}</p>
                                    )}
                                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                        {a.defaultLocation && <span>📍 {a.defaultLocation}</span>}
                                        {nextDate ? (
                                            <span>📅 {formatDateLabel(nextDate)} {a.upcomingSchedules[0].startTime} 〜 {a.upcomingSchedules[0].endTime}</span>
                                        ) : (a.defaultStartTime && (
                                            <span>🕐 {a.defaultStartTime} - {a.defaultEndTime}</span>
                                        ))}
                                    </div>
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="py-12 text-center text-gray-400 text-sm">
                    アクティビティがありません
                </p>
            )}

        </div>
    )
}

// ─── Calendar Sub-Tab ────────────────────────────────────

function CalendarSubTab({ communityId }: { communityId: string }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data: schedules = [], isLoading } = useCommunitySchedules(communityId, from, to)

    const scheduleDates = useMemo(() => {
        const set = new Set<string>()
        schedules.forEach((s) => set.add(s.date))
        return set
    }, [schedules])

    const selectedSchedules = useMemo(() => {
        if (!selectedDate) return []
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        return schedules.filter((s) => s.date === dateStr)
    }, [schedules, selectedDate])

    const hasSchedule = (date: Date) => scheduleDates.has(format(date, 'yyyy-MM-dd'))

    return (
        <div className="px-4 py-3">
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={{ hasSchedule }}
                    modifiersClassNames={{
                        hasSchedule: 'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full',
                    }}
                    className="rounded-md border"
                />
            </div>

            <div className="mt-4">
                {isLoading ? (
                    <div className="py-8 text-center text-gray-400 text-sm">読み込み中...</div>
                ) : selectedDate ? (
                    selectedSchedules.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {selectedSchedules.map((s) => (
                                <ScheduleCard key={s.scheduleId} schedule={s} />
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-gray-400 text-sm">
                            この日のスケジュールはありません
                        </p>
                    )
                ) : (
                    <p className="py-8 text-center text-gray-400 text-sm">
                        日付をタップしてスケジュールを表示
                    </p>
                )}
            </div>
        </div>
    )
}
