import { ScheduleCard } from '@/features/activity/components/ScheduleCard'
import { useUserSchedules } from '@/features/activity/hooks/useActivityQueries'
import { SectionTabs } from '@/shared/components/SectionTabs'
import { Calendar } from '@/shared/components/ui/calendar'
import { Input } from '@/shared/components/ui/input'
import type { UserScheduleItem } from '@/shared/types/api'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

/**
 * ActivityTopPage — BottomNav「アクティビティ」タブのランディング
 *
 * 2つのサブタブ:
 * - Calendar: 月間カレンダー + 日付タップで下部にスケジュール一覧
 * - TimeLine: 検索バー + 時系列スケジュールリスト
 */
export function ActivityTopPage() {
    return (
        <div className="flex flex-col h-full">
            <SectionTabs
                tabs={[
                    { value: 'timeline', label: 'タイムライン', content: <TimeLineTab /> },
                    { value: 'calendar', label: 'カレンダー', content: <CalendarTab /> },
                ]}
                defaultValue="timeline"
            />
        </div>
    )
}

// ─── Calendar Tab ────────────────────────────────────────

function CalendarTab() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data, isLoading } = useUserSchedules(from, to)

    const schedules = data?.schedules ?? []

    // スケジュールがある日のセット（ドット表示用）
    const scheduleDates = useMemo(() => {
        const set = new Set<string>()
        schedules.forEach((s) => set.add(s.date))
        return set
    }, [schedules])

    // 選択日のスケジュール
    const selectedSchedules = useMemo(() => {
        if (!selectedDate) return []
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        return schedules.filter((s) => s.date === dateStr)
    }, [schedules, selectedDate])

    // modifiers: スケジュールがある日
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

            {/* 選択日のスケジュール一覧 */}
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

// ─── TimeLine Tab ────────────────────────────────────────

function TimeLineTab() {
    const [search, setSearch] = useState('')
    const [showPast, setShowPast] = useState(false)

    // 未来90日分
    const futureFrom = format(new Date(), 'yyyy-MM-dd')
    const futureToDate = new Date()
    futureToDate.setDate(futureToDate.getDate() + 90)
    const futureTo = format(futureToDate, 'yyyy-MM-dd')

    // 過去90日分
    const pastToDate = new Date()
    pastToDate.setDate(pastToDate.getDate() - 1)
    const pastTo = format(pastToDate, 'yyyy-MM-dd')
    const pastFromDate = new Date()
    pastFromDate.setDate(pastFromDate.getDate() - 90)
    const pastFrom = format(pastFromDate, 'yyyy-MM-dd')

    const { data: futureData, isLoading: futureLoading } = useUserSchedules(futureFrom, futureTo)
    const { data: pastData, isLoading: pastLoading } = useUserSchedules(
        showPast ? pastFrom : futureFrom,
        showPast ? pastTo : futureFrom,
    )

    const isLoading = futureLoading || (showPast && pastLoading)

    const schedules = useMemo(() => {
        const future = futureData?.schedules ?? []
        const past = showPast ? (pastData?.schedules ?? []) : []
        // 過去は新しい順 (reverse)、合わせて「過去 (desc) → 今日 → 未来 (asc)」
        const combined = [...past.slice().reverse(), ...future]
        if (!search.trim()) return combined
        const q = search.toLowerCase()
        return combined.filter(
            (s: UserScheduleItem) =>
                s.activityTitle.toLowerCase().includes(q) ||
                s.communityName.toLowerCase().includes(q) ||
                (s.location?.toLowerCase().includes(q) ?? false)
        )
    }, [futureData, pastData, showPast, search])

    return (
        <div className="flex flex-col">
            <div className="px-4 py-3 space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="pl-9"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowPast(!showPast)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${showPast
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    {showPast ? '過去を非表示' : '過去のスケジュールも表示'}
                </button>
            </div>

            {isLoading ? (
                <div className="py-8 text-center text-gray-400 text-sm">読み込み中...</div>
            ) : schedules.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {schedules.map((s: UserScheduleItem, i: number) => {
                        const prevMonth = i > 0 ? schedules[i - 1].date.slice(0, 7) : null
                        const curMonth = s.date.slice(0, 7)
                        const showHeader = curMonth !== prevMonth
                        const [y, m] = curMonth.split('-')
                        return (
                            <div key={s.scheduleId}>
                                {showHeader && (
                                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                                        {y}年{Number(m)}月
                                    </div>
                                )}
                                <ScheduleCard schedule={s} />
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="py-12 text-center text-gray-400 text-sm">
                    スケジュールがありません
                </p>
            )}
        </div>
    )
}
