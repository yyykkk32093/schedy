/**
 * 日時フォーマットユーティリティ
 *
 * 相対時刻・絶対時刻・時刻のみなど、表示用の日時変換を集約
 */

/**
 * 相対時刻表示
 * - 0〜60分: `○分前`
 * - 60分〜24時間: `○時間前`
 * - 24時間以降: `yyyy/mm/dd` 形式
 */
export function formatRelativeTime(date: Date | string): string {
    const then = typeof date === 'string' ? new Date(date) : date
    const now = Date.now()
    const diffMs = now - then.getTime()
    const diffMin = Math.floor(diffMs / 60_000)

    if (diffMin < 1) return 'たった今'
    if (diffMin < 60) return `${diffMin}分前`

    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}時間前`

    const y = then.getFullYear()
    const m = String(then.getMonth() + 1).padStart(2, '0')
    const d = String(then.getDate()).padStart(2, '0')
    return `${y}/${m}/${d}`
}

/**
 * 絶対日時（ツールチップ用）
 * @returns `yyyy/mm/dd hh:mm` 形式
 */
export function formatAbsoluteDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}/${mo}/${day} ${h}:${min}`
}

/**
 * 時刻のみ（24時間形式）
 * @returns `hh:mm` 形式
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${min}`
}

/**
 * 行数を推定する（文字列の改行 + 1行あたり文字数での折り返しを考慮）
 * @param text テキスト
 * @param charsPerLine 1行あたりの文字数（デフォルト: 25）
 * @returns 推定行数
 */
export function estimateLineCount(text: string, charsPerLine = 25): number {
    const lines = text.split('\n')
    let totalLines = 0
    for (const line of lines) {
        // 空行は1行としてカウント
        totalLines += Math.max(1, Math.ceil(line.length / charsPerLine))
    }
    return totalLines
}
