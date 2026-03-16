import { Button } from '@/shared/components/ui/button'
import { useNavigate } from 'react-router-dom'

/**
 * NotFoundPage — 存在しないルートにアクセスした際に表示する 404 ページ
 */
export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-6xl font-bold text-gray-300">404</p>
            <h1 className="mt-4 text-lg font-semibold text-gray-700">
                ページが見つかりません
            </h1>
            <p className="mt-2 text-sm text-gray-500">
                お探しのページは存在しないか、移動された可能性があります。
            </p>
            <Button
                className="mt-6"
                onClick={() => navigate('/home', { replace: true })}
            >
                ホームに戻る
            </Button>
        </div>
    )
}
