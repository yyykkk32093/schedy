import {
    useAttendSchedule,
    useCancelAttendance,
    useCancelWaitlist,
    useConfirmPayment,
    useJoinWaitlist,
    useParticipants,
    useReportPayment,
} from '@/features/participation/hooks/useParticipationQueries'
import {
    useCancelSchedule,
    useSchedule,
    useUpdateSchedule,
} from '@/features/schedule/hooks/useScheduleQueries'
import { CheckCircle, ChevronDown, CreditCard, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PAYMENT_LABELS: Record<string, string> = {
    CASH: '現金',
    PAYPAY: 'PayPay',
    STRIPE: 'カード決済',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    UNPAID: '未払い',
    REPORTED: '報告済み',
    CONFIRMED: '確認済み',
    REJECTED: '却下',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    UNPAID: 'bg-gray-100 text-gray-600',
    REPORTED: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
}

export function ScheduleDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: schedule, isLoading } = useSchedule(id!)
    const { data: participantsData } = useParticipants(id!)

    const updateMutation = useUpdateSchedule(id!, schedule?.activityId ?? '')
    const cancelScheduleMutation = useCancelSchedule(schedule?.activityId ?? '')

    const attendMutation = useAttendSchedule(id!)
    const cancelAttendanceMutation = useCancelAttendance(id!)
    const joinWaitlistMutation = useJoinWaitlist(id!)
    const cancelWaitlistMutation = useCancelWaitlist(id!)
    const reportPaymentMutation = useReportPayment(id!)
    const confirmPaymentMutation = useConfirmPayment(id!)

    const [editing, setEditing] = useState(false)
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState('')
    const [note, setNote] = useState('')
    const [capacity, setCapacity] = useState('')
    const [participationFee, setParticipationFee] = useState('')

    // UBL-7: SplitButton dropdown state
    const [paymentMenuOpen, setPaymentMenuOpen] = useState(false)

    if (isLoading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>
    if (!schedule) return <div className="p-6 text-center text-red-500">スケジュールが見つかりません</div>

    const startEdit = () => {
        setDate(schedule.date)
        setStartTime(schedule.startTime)
        setEndTime(schedule.endTime)
        setLocation(schedule.location ?? '')
        setNote(schedule.note ?? '')
        setCapacity(schedule.capacity != null ? String(schedule.capacity) : '')
        setParticipationFee(schedule.participationFee != null ? String(schedule.participationFee) : '')
        setEditing(true)
    }

    const handleUpdate = async () => {
        await updateMutation.mutateAsync({
            date,
            startTime,
            endTime,
            location: location || null,
            note: note || null,
            capacity: capacity ? Number(capacity) : null,
            participationFee: participationFee ? Number(participationFee) : null,
        })
        setEditing(false)
    }

    const handleCancelSchedule = async () => {
        if (!confirm('このスケジュールをキャンセルしますか？')) return
        await cancelScheduleMutation.mutateAsync(id!)
        navigate(`/activities/${schedule.activityId}/schedules`)
    }

    const handleAttendWithPayment = (paymentMethod: string) => {
        attendMutation.mutate({ paymentMethod })
        setPaymentMenuOpen(false)
    }

    const isCancelled = schedule.status === 'CANCELLED'
    const hasFee = schedule.participationFee != null && schedule.participationFee > 0
    const participants = participantsData?.participants ?? []

    return (
        <div className="max-w-2xl mx-auto p-6">
            {editing ? (
                <div className="mb-6 space-y-3 p-4 border rounded-lg bg-gray-50">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <div className="flex gap-2">
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                    </div>
                    <input type="text" placeholder="場所" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <textarea placeholder="メモ" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                    <input type="number" placeholder="定員" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <input type="number" placeholder="参加費（円）" value={participationFee} onChange={(e) => setParticipationFee(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <div className="flex gap-2">
                        <button onClick={handleUpdate} disabled={updateMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">保存</button>
                        <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">キャンセル</button>
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{schedule.date}</h1>
                        <div className="flex gap-2">
                            {!isCancelled && (
                                <>
                                    <button onClick={startEdit} className="text-blue-600 hover:underline text-sm">編集</button>
                                    <button onClick={handleCancelSchedule} className="text-red-500 hover:underline text-sm">キャンセル</button>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-600 mt-1">🕐 {schedule.startTime} - {schedule.endTime}</p>
                    {schedule.location && <p className="text-gray-600">📍 {schedule.location}</p>}
                    {schedule.note && <p className="text-gray-600 mt-2">{schedule.note}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {schedule.status}
                        </span>
                        {schedule.capacity != null && <span className="text-xs text-gray-500">定員: {schedule.capacity}</span>}
                        {hasFee && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                💰 ¥{schedule.participationFee!.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* --- 参加アクション --- */}
            {!isCancelled && (
                <div className="border rounded-lg p-4 space-y-3">
                    <h2 className="font-semibold text-lg">参加</h2>
                    <div className="flex flex-wrap gap-2">
                        {/* UBL-7: SplitButton — 参加費がある場合は支払方法選択付き */}
                        {hasFee ? (
                            <div className="relative inline-flex">
                                <button
                                    onClick={() => handleAttendWithPayment('CASH')}
                                    disabled={attendMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-l-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {attendMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                                    ) : (
                                        <CreditCard className="h-4 w-4 inline mr-1" />
                                    )}
                                    現金で参加
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMenuOpen(!paymentMenuOpen)}
                                    className="px-2 py-2 bg-blue-700 text-white rounded-r-lg text-sm hover:bg-blue-800 border-l border-blue-500"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {paymentMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setPaymentMenuOpen(false)} />
                                        <div className="absolute top-full left-0 z-20 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg">
                                            {['CASH', 'PAYPAY'].map((method) => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => handleAttendWithPayment(method)}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                >
                                                    {PAYMENT_LABELS[method]}で参加
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => attendMutation.mutate({})}
                                disabled={attendMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                参加する
                            </button>
                        )}

                        <button
                            onClick={() => cancelAttendanceMutation.mutate()}
                            disabled={cancelAttendanceMutation.isPending}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
                        >
                            参加取消
                        </button>
                        <button
                            onClick={() => joinWaitlistMutation.mutate()}
                            disabled={joinWaitlistMutation.isPending}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
                        >
                            キャンセル待ち
                        </button>
                        <button
                            onClick={() => cancelWaitlistMutation.mutate()}
                            disabled={cancelWaitlistMutation.isPending}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
                        >
                            WL取消
                        </button>
                    </div>
                    {attendMutation.isError && <p className="text-red-500 text-sm">{(attendMutation.error as Error).message}</p>}
                    {joinWaitlistMutation.isError && <p className="text-red-500 text-sm">{(joinWaitlistMutation.error as Error).message}</p>}
                    {attendMutation.isSuccess && <p className="text-green-600 text-sm">参加登録しました ✓</p>}
                    {joinWaitlistMutation.isSuccess && <p className="text-yellow-600 text-sm">キャンセル待ち登録しました ✓</p>}
                    {cancelAttendanceMutation.isSuccess && <p className="text-gray-600 text-sm">参加を取り消しました</p>}
                    {cancelWaitlistMutation.isSuccess && <p className="text-gray-600 text-sm">キャンセル待ちを取り消しました</p>}
                </div>
            )}

            {/* UBL-8: 参加者リスト（支払状況つき） */}
            {participants.length > 0 && (
                <div className="mt-6 border rounded-lg p-4">
                    <h2 className="font-semibold text-lg mb-3">参加者一覧</h2>
                    <div className="divide-y">
                        {participants.map((p) => (
                            <div key={p.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {p.userId.slice(0, 8)}…
                                        {p.isVisitor && <span className="ml-1 text-xs text-gray-400">(ビジター)</span>}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {p.status}
                                    </span>
                                </div>

                                {/* 支払情報 */}
                                {hasFee && p.paymentStatus && (
                                    <div className="flex items-center gap-2">
                                        {p.paymentMethod && (
                                            <span className="text-xs text-gray-500">{PAYMENT_LABELS[p.paymentMethod] ?? p.paymentMethod}</span>
                                        )}
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${PAYMENT_STATUS_COLORS[p.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {PAYMENT_STATUS_LABELS[p.paymentStatus] ?? p.paymentStatus}
                                        </span>

                                        {/* 支払報告ボタン（本人用 - UNPAID時） */}
                                        {p.paymentStatus === 'UNPAID' && (
                                            <button
                                                onClick={() => reportPaymentMutation.mutate(p.id)}
                                                disabled={reportPaymentMutation.isPending}
                                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                            >
                                                支払報告
                                            </button>
                                        )}

                                        {/* 支払確認ボタン（管理者用 - REPORTED時） */}
                                        {p.paymentStatus === 'REPORTED' && (
                                            <button
                                                onClick={() => confirmPaymentMutation.mutate(p.id)}
                                                disabled={confirmPaymentMutation.isPending}
                                                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                確認
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


