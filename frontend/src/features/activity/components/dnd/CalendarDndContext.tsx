import type { UserScheduleItem } from '@/shared/types/api'
import { createContext, useContext } from 'react'

/**
 * CalendarSchedulesContext — カレンダー内の Day コンポーネントが
 * 各日付のスケジュール情報にアクセスするための React Context。
 *
 * Map のキーは 'yyyy-MM-dd' 形式の日付文字列。
 */
export const CalendarSchedulesContext = createContext<Map<string, UserScheduleItem[]>>(
    new Map(),
)

/** 指定日付のスケジュール一覧を取得するフック */
export function useCalendarSchedules(dateStr: string): UserScheduleItem[] {
    const map = useContext(CalendarSchedulesContext)
    return map.get(dateStr) ?? []
}
