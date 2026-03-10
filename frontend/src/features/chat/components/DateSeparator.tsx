/**
 * 日付セパレーター
 * メッセージ間に日付が変わったタイミングで表示
 */
export function DateSeparator({ date }: { date: string }) {
    return (
        <div className="flex items-center justify-center py-3 px-4">
            <span className="text-xs text-gray-400">
                {new Date(date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </span>
        </div>
    )
}
