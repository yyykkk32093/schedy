import { BarChart3 } from 'lucide-react'
import { useParams } from 'react-router-dom'

/**
 * AnalyticsPage — コミュニティ統計ページ（プレースホルダー）
 *
 * BE API（/v1/communities/:id/analytics/stats 等）は実装済み。
 * フロントの統計ダッシュボード UI は今後のフェーズで実装予定。
 */
export function AnalyticsPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">統計ページ</h2>
            <p className="text-sm text-gray-400 mt-2">
                コミュニティの統計情報は現在準備中です。
            </p>
            <p className="text-xs text-gray-300 mt-4">Community ID: {id}</p>
        </div>
    )
}
