import {
    useMarkNoRefund,
    useMarkRefundCompleted,
    useRefundPendingBySchedule,
} from '@/features/participation/hooks/useParticipationQueries'
import type { RefundPendingPaymentItem } from '@/shared/types/api'
import { AlertTriangle, Ban, Check, Loader2 } from 'lucide-react'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: '現金',
    PAYPAY: 'PayPay',
    STRIPE: 'カード決済',
}

/**
 * RefundPendingSection — スケジュール単位の返金待ち一覧
 *
 * 管理者のみ表示。REFUND_PENDING な Payment がある場合に表示される。
 * 管理者は「返金済」ボタンで REFUNDED に遷移、「返金不要」で NO_REFUND に遷移できる。
 */
export function RefundPendingSection({ scheduleId }: { scheduleId: string }) {
    const { data, isLoading } = useRefundPendingBySchedule(scheduleId)
    const markRefundMutation = useMarkRefundCompleted()
    const markNoRefundMutation = useMarkNoRefund()

    if (isLoading) return null

    const payments = data?.payments ?? []
    if (payments.length === 0) return null

    return (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-semibold text-orange-800">
                    返金待ち（{payments.length}件）
                </h3>
            </div>

            <div className="space-y-2">
                {payments.map((p: RefundPendingPaymentItem) => (
                    <div
                        key={p.paymentId}
                        className="flex items-center justify-between bg-white rounded px-3 py-2 border border-orange-100"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {p.displayName ?? p.userId.slice(0, 8)}
                            </p>
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
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button
                                onClick={() => markRefundMutation.mutate(p.paymentId)}
                                disabled={markRefundMutation.isPending || markNoRefundMutation.isPending}
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
                                disabled={markRefundMutation.isPending || markNoRefundMutation.isPending}
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
                ))}
            </div>
        </div>
    )
}
