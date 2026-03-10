import { useMyRole } from '@/features/community/hooks/useCommunityQueries'
import { ParticipationActionButton } from '@/features/participation/components/ParticipationActionButton'
import {
    useConfirmPayment,
    useParticipants,
    useRemoveParticipant,
    useReportPayment,
} from '@/features/participation/hooks/useParticipationQueries'
import {
    useCancelSchedule,
    useSchedule,
    useUpdateSchedule,
} from '@/features/schedule/hooks/useScheduleQueries'
import { CheckCircle, Trash2 } from 'lucide-react'
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

    const reportPaymentMutation = useReportPayment(id!)
    const confirmPaymentMutation = useConfirmPayment(id!)
    const removeParticipantMutation = useRemoveParticipant(id!)

    // 管理者権限チェック（communityId が取得できるまでスキップ）
    const { isAdminOrAbove } = useMyRole(schedule?.communityId ?? '')

    const [editing, setEditing] = useState(false)
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState('')
    const [note, setNote] = useState('')
    const [capacity, setCapacity] = useState('')
    const [participationFee, setParticipationFee] = useState('')

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

    const handleRemoveParticipant = (userId: string) => {
        if (!confirm('この参加者を除外しますか？')) return
        removeParticipantMutation.mutate(userId)
    }

    const isCancelled = schedule.status === 'CANCELLED'
    const hasFee = schedule.participationFee != null && schedule.participationFee > 0
    const participants = participantsData?.participants ?? []
    const myStatus = schedule.myStatus ?? 'none'
    const isFull = schedule.capacity != null && schedule.attendingCount != null && schedule.attendingCount >= schedule.capacity

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
                    {schedule.isOnline && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                🌐 オンライン
                            </span>
                            {schedule.meetingUrl && (
                                <a
                                    href={schedule.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate"
                                >
                                    会議URLを開く
                                </a>
                            )}
                        </div>
                    )}
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
                    <ParticipationActionButton scheduleId={id!} hasFee={hasFee} myStatus={myStatus} isFull={isFull} />
                </div>
            )}

            {/* UBL-8: 参加者リスト（支払状況つき + 管理者除外） */}
            {participants.length > 0 && (
                <div className="mt-6 border rounded-lg p-4">
                    <h2 className="font-semibold text-lg mb-3">参加者一覧</h2>
                    <div className="divide-y">
                        {participants.map((p) => (
                            <div key={p.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {p.displayName ?? p.userId.slice(0, 8) + '…'}
                                        {p.isVisitor && <span className="ml-1 text-xs text-gray-400">(ビジター)</span>}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.status === 'ATTENDING' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {p.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* 支払情報 */}
                                    {hasFee && p.paymentStatus && (
                                        <>
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
                                            {p.paymentStatus === 'REPORTED' && isAdminOrAbove && (
                                                <button
                                                    onClick={() => confirmPaymentMutation.mutate(p.id)}
                                                    disabled={confirmPaymentMutation.isPending}
                                                    className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                    確認
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* 管理者による参加者除外ボタン */}
                                    {isAdminOrAbove && p.status === 'ATTENDING' && (
                                        <button
                                            onClick={() => handleRemoveParticipant(p.userId)}
                                            disabled={removeParticipantMutation.isPending}
                                            className="text-xs p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                            title="参加者を除外"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>)}
        </div>
    )
}