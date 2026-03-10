import {
    useAttendSchedule,
    useCancelAttendance,
    useCancelWaitlist,
    useJoinWaitlist,
} from '@/features/participation/hooks/useParticipationQueries'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const PAYMENT_LABELS: Record<string, string> = {
    CASH: '現金',
    PAYPAY: 'PayPay',
    STRIPE: 'カード決済',
}

export type MyScheduleStatus = 'none' | 'attending' | 'waitlisted'

interface ParticipationActionButtonProps {
    scheduleId: string
    /** 参加費がある場合 true（SplitButton で支払方法選択） */
    hasFee: boolean
    /** 自分の参加状態 */
    myStatus: MyScheduleStatus
    /** 上限に達している場合 true — none 状態時に「キャンセル待ち」ボタンを表示 */
    isFull?: boolean
}

/**
 * ParticipationActionButton — 参加 / キャンセル / WL の統一コンポーネント
 *
 * myStatus に応じてボタンを出し分ける:
 * - none + !isFull      → 「参加する」（hasFee ならプルダウンで支払方法選択）
 * - none + isFull       → 「キャンセル待ち」
 * - attending           → 「参加取消」
 * - waitlisted          → 「キャンセル待ち取消」
 */
export function ParticipationActionButton({
    scheduleId,
    hasFee,
    myStatus,
    isFull = false,
}: ParticipationActionButtonProps) {
    const attendMutation = useAttendSchedule(scheduleId)
    const cancelAttendanceMutation = useCancelAttendance(scheduleId)
    const joinWaitlistMutation = useJoinWaitlist(scheduleId)
    const cancelWaitlistMutation = useCancelWaitlist(scheduleId)

    const [paymentMethod, setPaymentMethod] = useState('CASH')

    // 成功メッセージを3秒後にリセット
    useEffect(() => {
        if (attendMutation.isSuccess) {
            const t = setTimeout(() => attendMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [attendMutation.isSuccess])

    useEffect(() => {
        if (joinWaitlistMutation.isSuccess) {
            const t = setTimeout(() => joinWaitlistMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [joinWaitlistMutation.isSuccess])

    useEffect(() => {
        if (cancelAttendanceMutation.isSuccess) {
            const t = setTimeout(() => cancelAttendanceMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [cancelAttendanceMutation.isSuccess])

    useEffect(() => {
        if (cancelWaitlistMutation.isSuccess) {
            const t = setTimeout(() => cancelWaitlistMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [cancelWaitlistMutation.isSuccess])

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {/* ── 未参加 ── */}
                {myStatus === 'none' && !isFull && (
                    <>
                        {hasFee && (
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-32 h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <button
                            onClick={() => attendMutation.mutate(hasFee ? { paymentMethod } : {})}
                            disabled={attendMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {attendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                            参加する
                        </button>
                    </>
                )}

                {/* ── 満員 → キャンセル待ち登録 ── */}
                {myStatus === 'none' && isFull && (
                    <button
                        onClick={() => joinWaitlistMutation.mutate()}
                        disabled={joinWaitlistMutation.isPending}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {joinWaitlistMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                        キャンセル待ち
                    </button>
                )}

                {/* ── 参加済み → 参加取消 ── */}
                {myStatus === 'attending' && (
                    <button
                        onClick={() => cancelAttendanceMutation.mutate()}
                        disabled={cancelAttendanceMutation.isPending}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                    >
                        {cancelAttendanceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                        参加を取り消す
                    </button>
                )}

                {/* ── キャンセル待ち中 → WL取消 ── */}
                {myStatus === 'waitlisted' && (
                    <button
                        onClick={() => cancelWaitlistMutation.mutate()}
                        disabled={cancelWaitlistMutation.isPending}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
                    >
                        {cancelWaitlistMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                        キャンセル待ちを取り消す
                    </button>
                )}
            </div>

            {/* フィードバック */}
            {attendMutation.isError && <p className="text-red-500 text-sm">{(attendMutation.error as Error).message}</p>}
            {joinWaitlistMutation.isError && <p className="text-red-500 text-sm">{(joinWaitlistMutation.error as Error).message}</p>}
            {cancelAttendanceMutation.isError && <p className="text-red-500 text-sm">{(cancelAttendanceMutation.error as Error).message}</p>}
            {cancelWaitlistMutation.isError && <p className="text-red-500 text-sm">{(cancelWaitlistMutation.error as Error).message}</p>}
            {attendMutation.isSuccess && <p className="text-green-600 text-sm">参加登録しました ✓</p>}
            {joinWaitlistMutation.isSuccess && <p className="text-yellow-600 text-sm">キャンセル待ち登録しました ✓</p>}
            {cancelAttendanceMutation.isSuccess && <p className="text-gray-600 text-sm">参加を取り消しました</p>}
            {cancelWaitlistMutation.isSuccess && <p className="text-gray-600 text-sm">キャンセル待ちを取り消しました</p>}
        </div>
    )
}
