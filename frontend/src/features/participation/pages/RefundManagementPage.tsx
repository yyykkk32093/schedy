import { useMarkNoRefund, useMarkRefundCompleted, useRefundPendingByCommunity } from '@/features/participation/hooks/useParticipationQueries'
import type { RefundPendingPaymentItem } from '@/shared/types/api'
import { AlertTriangle, Ban, Check, History, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: '現金',
    PAYPAY: 'PayPay',
    STRIPE: 'カード決済',
}

type ViewMode = 'by-user' | 'by-schedule'

/**
 * RefundManagementPage — コミュニティレベルの返金管理ページ
 *
 * 管理者がコミュニティ配下の全 REFUND_PENDING な Payment を一覧・操作できる。
 * 2つのビューモード:
 *  - ユーザー主体: ユーザーごとにグルーピング
 *  - スケジュール主体: スケジュールごとにグルーピング
 */
export function RefundManagementPage() {
    const { id: communityId } = useParams<{ id: string }>()
    const { data, isLoading } = useRefundPendingByCommunity(communityId!)
    const markRefundMutation = useMarkRefundCompleted()
    const markNoRefundMutation = useMarkNoRefund()
    const [viewMode, setViewMode] = useState<ViewMode>('by-user')

    const payments = data?.payments ?? []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (payments.length === 0) {
        return (
            <div className="max-w-lg mx-auto px-4 py-10">
                <div className="text-center text-gray-500 space-y-2">
                    <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm">返金待ちの支払いはありません</p>
                    <Link
                        to={`/communities/${communityId}/refunds/history`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                    >
                        <History className="w-3.5 h-3.5" />
                        履歴を見る
                    </Link>
                </div>
            </div>
        )
    }

    // ユーザーごとにグルーピング
    const groupedByUser = payments.reduce<Record<string, RefundPendingPaymentItem[]>>((acc, p) => {
        const key = p.userId
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
    }, {})

    // スケジュールごとにグルーピング
    const groupedBySchedule = payments.reduce<Record<string, RefundPendingPaymentItem[]>>((acc, p) => {
        const key = p.scheduleId
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
    }, {})

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">
                    返金管理（{payments.length}件）
                </h1>
                <Link
                    to={`/communities/${communityId}/refunds/history`}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                >
                    <History className="w-3.5 h-3.5" />
                    履歴を見る
                </Link>
            </div>

            {/* ビューモード切替 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setViewMode('by-user')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'by-user'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    ユーザー別
                </button>
                <button
                    onClick={() => setViewMode('by-schedule')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'by-schedule'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    スケジュール別
                </button>
            </div>

            {/* ユーザー主体ビュー */}
            {viewMode === 'by-user' && (
                <div className="space-y-3">
                    {Object.entries(groupedByUser).map(([userId, items]) => (
                        <div key={userId} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b">
                                <p className="text-sm font-medium text-gray-900">
                                    {items[0].displayName ?? userId.slice(0, 8)}
                                </p>
                                <p className="text-xs text-gray-500">{items.length}件の返金待ち</p>
                            </div>
                            <div className="divide-y">
                                {items.map((p) => (
                                    <RefundPaymentRow
                                        key={p.paymentId}
                                        payment={p}
                                        showUser={false}
                                        markRefundMutation={markRefundMutation}
                                        markNoRefundMutation={markNoRefundMutation}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* スケジュール主体ビュー */}
            {viewMode === 'by-schedule' && (
                <div className="space-y-3">
                    {Object.entries(groupedBySchedule).map(([scheduleId, items]) => (
                        <div key={scheduleId} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b">
                                <p className="text-sm font-medium text-gray-900">
                                    {items[0].activityTitle ?? 'スケジュール'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {items[0].scheduleDate}{items[0].scheduleStartTime && ` ${items[0].scheduleStartTime}〜`}
                                    {' · '}{items.length}件の返金待ち
                                </p>
                            </div>
                            <div className="divide-y">
                                {items.map((p) => (
                                    <RefundPaymentRow
                                        key={p.paymentId}
                                        payment={p}
                                        showUser={true}
                                        markRefundMutation={markRefundMutation}
                                        markNoRefundMutation={markNoRefundMutation}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── 個別の返金行 ────────────────────────────────────────

function RefundPaymentRow({
    payment: p,
    showUser,
    markRefundMutation,
    markNoRefundMutation,
}: {
    payment: RefundPendingPaymentItem
    showUser: boolean
    markRefundMutation: ReturnType<typeof useMarkRefundCompleted>
    markNoRefundMutation: ReturnType<typeof useMarkNoRefund>
}) {
    const isPending = markRefundMutation.isPending || markNoRefundMutation.isPending

    return (
        <div className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 min-w-0">
                {showUser && (
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {p.displayName ?? p.userId.slice(0, 8)}
                    </p>
                )}
                {p.activityTitle && (
                    <div className="text-xs text-blue-600">
                        <p className="truncate">{p.activityTitle}</p>
                        <p className="text-gray-500">
                            返金発生: {new Date(p.updatedAt).toLocaleDateString('ja-JP')} {new Date(p.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            {p.paymentNumber > 1 && ` （${p.paymentNumber}回目の支払い）`}
                        </p>
                    </div>
                )}
                <p className="text-xs text-gray-500">
                    {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod} ·
                    ¥{p.amount.toLocaleString()}
                    {p.feeAmount > 0 && (
                        <span className="text-gray-400">（手数料 ¥{p.feeAmount.toLocaleString()}）</span>
                    )}
                </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                    onClick={() => markRefundMutation.mutate(p.paymentId)}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                    title="返金済みにする"
                >
                    {markRefundMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Check className="w-3 h-3" />
                    )}
                    返金済
                </button>
                <button
                    onClick={() => markNoRefundMutation.mutate(p.paymentId)}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                    title="返金不要にする"
                >
                    {markNoRefundMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Ban className="w-3 h-3" />
                    )}
                    不要
                </button>
            </div>
        </div>
    )
}
