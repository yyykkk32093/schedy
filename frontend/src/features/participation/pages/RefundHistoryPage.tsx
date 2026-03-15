import { usePaymentHistory, useRevertRefundStatus } from '@/features/participation/hooks/useParticipationQueries'
import type { ResolvedPaymentItem } from '@/shared/types/api'
import { History, Loader2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: '現金',
    PAYPAY: 'PayPay',
    STRIPE: 'カード決済',
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    REFUNDED: { label: '返金済', className: 'text-green-600 bg-green-50' },
    NO_REFUND: { label: '返金不要', className: 'text-gray-600 bg-gray-100' },
}

type ViewMode = 'by-user' | 'by-schedule'

/**
 * RefundHistoryPage — 返金履歴ページ
 *
 * REFUNDED / NO_REFUND の Payment をコミュニティ単位で一覧表示。
 * 管理者が「返金待ちに戻す」操作が可能。
 */
export function RefundHistoryPage() {
    const { id: communityId } = useParams<{ id: string }>()
    const { data, isLoading } = usePaymentHistory(communityId!)
    const revertMutation = useRevertRefundStatus()
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
                    <History className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm">返金履歴はありません</p>
                </div>
            </div>
        )
    }

    // ユーザーごとにグルーピング
    const groupedByUser = payments.reduce<Record<string, ResolvedPaymentItem[]>>((acc, p) => {
        const key = p.userId
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
    }, {})

    // スケジュールごとにグルーピング
    const groupedBySchedule = payments.reduce<Record<string, ResolvedPaymentItem[]>>((acc, p) => {
        const key = p.scheduleId
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
    }, {})

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">
                    返金履歴（{payments.length}件）
                </h1>
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
                                <p className="text-xs text-gray-500">{items.length}件</p>
                            </div>
                            <div className="divide-y">
                                {items.map((p) => (
                                    <HistoryRow
                                        key={p.paymentId}
                                        payment={p}
                                        showUser={false}
                                        revertMutation={revertMutation}
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
                                    {items[0].scheduleDate && items[0].scheduleDate}
                                    {items[0].scheduleStartTime && ` ${items[0].scheduleStartTime}〜`}
                                    {' · '}{items.length}件
                                </p>
                            </div>
                            <div className="divide-y">
                                {items.map((p) => (
                                    <HistoryRow
                                        key={p.paymentId}
                                        payment={p}
                                        showUser={true}
                                        revertMutation={revertMutation}
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

// ─── 個別の履歴行 ────────────────────────────────────────

function HistoryRow({
    payment: p,
    showUser,
    revertMutation,
}: {
    payment: ResolvedPaymentItem
    showUser: boolean
    revertMutation: ReturnType<typeof useRevertRefundStatus>
}) {
    const statusInfo = STATUS_LABELS[p.status] ?? { label: p.status, className: 'text-gray-500' }

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
                            処理日: {new Date(p.updatedAt).toLocaleDateString('ja-JP')} {new Date(p.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            {p.paymentNumber > 1 && ` （${p.paymentNumber}回目の支払い）`}
                        </p>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                        {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod} ·
                        ¥{p.amount.toLocaleString()}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                    </span>
                </div>
            </div>
            <div className="shrink-0 ml-2">
                <button
                    onClick={() => revertMutation.mutate(p.paymentId)}
                    disabled={revertMutation.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 disabled:opacity-50"
                    title="返金待ちに戻す"
                >
                    {revertMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Undo2 className="w-3 h-3" />
                    )}
                    戻す
                </button>
            </div>
        </div>
    )
}
