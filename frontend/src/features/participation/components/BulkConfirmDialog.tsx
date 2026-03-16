import { useBulkConfirmPayment } from '@/features/participation/hooks/useParticipationQueries'
import type { ParticipantItem } from '@/shared/types/api'
import { useEffect, useState } from 'react'

interface BulkConfirmDialogProps {
    scheduleId: string
    participants: ParticipantItem[]
    open: boolean
    onClose: () => void
}

/**
 * BulkConfirmDialog — 支払い一括確認ダイアログ (#40)
 *
 * 未済（UNPAID）または確認待ち（REPORTED）の参加者をチェックボックスで選択し、
 * まとめて支払い確認（CONFIRMED）する。
 */
export function BulkConfirmDialog({ scheduleId, participants, open, onClose }: BulkConfirmDialogProps) {
    const confirmableParticipants = participants.filter((p) => p.paymentStatus === 'UNPAID' || p.paymentStatus === 'REPORTED')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(confirmableParticipants.map((p) => p.id)))
    const bulkConfirm = useBulkConfirmPayment(scheduleId)

    // #40: ダイアログを開くたびに最新の対象者で選択をリセット
    useEffect(() => {
        if (open) {
            const fresh = participants.filter((p) => p.paymentStatus === 'UNPAID' || p.paymentStatus === 'REPORTED')
            setSelectedIds(new Set(fresh.map((p) => p.id)))
        }
    }, [open, participants])

    const [showFinalConfirm, setShowFinalConfirm] = useState(false)

    // ダイアログを閉じる時に最終確認もリセット
    useEffect(() => {
        if (!open) setShowFinalConfirm(false)
    }, [open])

    if (!open) return null

    const toggleId = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === confirmableParticipants.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(confirmableParticipants.map((p) => p.id)))
        }
    }

    const handleConfirm = () => {
        if (selectedIds.size === 0) return
        setShowFinalConfirm(true)
    }

    const handleFinalConfirm = async () => {
        setShowFinalConfirm(false)
        await bulkConfirm.mutateAsync(Array.from(selectedIds))
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md mx-4 p-5 animate-slide-up max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-gray-800 mb-1">支払い一括確認</h3>
                <p className="text-xs text-gray-500 mb-4">
                    未済・確認待ちの参加者を選択して、まとめて支払い確認できます。
                </p>

                {confirmableParticipants.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">対象の参加者はいません</p>
                ) : (
                    <>
                        {/* 全選択 / 全解除 */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <input
                                type="checkbox"
                                checked={selectedIds.size === confirmableParticipants.length}
                                onChange={toggleAll}
                                className="w-4 h-4 rounded accent-blue-500"
                            />
                            <span className="text-xs text-gray-600 font-medium">
                                全て選択（{selectedIds.size}/{confirmableParticipants.length}）
                            </span>
                        </div>

                        {/* 参加者リスト */}
                        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                            {confirmableParticipants.map((p) => (
                                <label
                                    key={p.id}
                                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(p.id)}
                                        onChange={() => toggleId(p.id)}
                                        className="w-4 h-4 rounded accent-blue-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 truncate">{p.displayName ?? p.userId}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {p.paymentMethod === 'CASH' ? '現金' : p.paymentMethod === 'PAYPAY' ? 'PayPay' : p.paymentMethod ?? '—'}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.paymentStatus === 'REPORTED' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'}`}>
                                        {p.paymentStatus === 'REPORTED' ? '確認待ち' : '未済'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </>
                )}

                {/* アクションボタン */}
                <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0 || bulkConfirm.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-lg transition-colors"
                    >
                        {bulkConfirm.isPending ? '処理中...' : `${selectedIds.size}件を確認`}
                    </button>
                </div>

                {/* 最終確認ダイアログ */}
                {showFinalConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                        <div
                            className="bg-white rounded-2xl w-full max-w-sm mx-4 p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h4 className="text-base font-semibold text-gray-800 mb-2">確認</h4>
                            <p className="text-sm text-gray-600 mb-1">
                                選択した {selectedIds.size} 件の支払いを確認済みにします。
                            </p>
                            <p className="text-xs text-red-500 mb-4">
                                ※ この操作は取り消しできません。
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowFinalConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFinalConfirm}
                                    disabled={bulkConfirm.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 rounded-lg transition-colors"
                                >
                                    {bulkConfirm.isPending ? '処理中...' : '確認する'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
