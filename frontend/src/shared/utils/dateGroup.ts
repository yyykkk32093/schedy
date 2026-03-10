/**
 * 日付グルーピング & フォーマットユーティリティ
 *
 * タイムライン系の画面（コミュニティ詳細・ユーザー側）で共通利用
 */

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

/** 日付文字列 (YYYY-MM-DD) → 日 (数値) */
export function formatDay(dateStr: string): number {
    return new Date(dateStr + 'T00:00:00').getDate()
}

/** 日付文字列 (YYYY-MM-DD) → 曜日 (日/月/火/...) */
export function formatWeekday(dateStr: string): string {
    return WEEKDAYS[new Date(dateStr + 'T00:00:00').getDay()]
}

/** 日付文字列 (YYYY-MM-DD) → "M月D日(曜)" */
export function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`
}

/** 日付でグルーピングされた1日分 */
export interface DateGroup<T> {
    date: string      // YYYY-MM-DD
    items: T[]
}

/** 月でグルーピングされた1ヶ月分 */
export interface MonthGroup<T> {
    month: string      // YYYY-MM
    dateGroups: DateGroup<T>[]
}

/**
 * 日付 (YYYY-MM-DD) を持つアイテム配列を、月 → 日の二段グルーピングに変換
 *
 * 入力はソート済みを前提とする
 *
 * @param items - ソート済みアイテム配列
 * @param getDate - アイテムから日付文字列 (YYYY-MM-DD) を取得する関数
 * @returns 月 → 日付グループの二段構造
 */
export function groupByMonthAndDate<T>(
    items: T[],
    getDate: (item: T) => string,
): MonthGroup<T>[] {
    const result: MonthGroup<T>[] = []

    for (const item of items) {
        const dateStr = getDate(item)
        const month = dateStr.slice(0, 7)

        // 月グループの取得 or 新規作成
        let monthGroup = result[result.length - 1]
        if (!monthGroup || monthGroup.month !== month) {
            monthGroup = { month, dateGroups: [] }
            result.push(monthGroup)
        }

        // 日グループの取得 or 新規作成
        let dateGroup = monthGroup.dateGroups[monthGroup.dateGroups.length - 1]
        if (!dateGroup || dateGroup.date !== dateStr) {
            dateGroup = { date: dateStr, items: [] }
            monthGroup.dateGroups.push(dateGroup)
        }

        dateGroup.items.push(item)
    }

    return result
}
