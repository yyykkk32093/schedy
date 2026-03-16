import { useActivity, useChangeOrganizer, useDeleteActivity } from '@/features/activity/hooks/useActivityQueries'
import { chatApi } from '@/features/chat/api/chatApi'
import { useMyRole } from '@/features/community/hooks/useCommunityQueries'
import { useMembers } from '@/features/community/hooks/useMemberQueries'
import { BulkConfirmDialog } from '@/features/participation/components/BulkConfirmDialog'
import { ParticipationActionButton } from '@/features/participation/components/ParticipationActionButton'
import { RefundPendingSection } from '@/features/participation/components/RefundPendingSection'
import { useAddGuestVisitor, useConfirmPayment, useParticipants, useUpdateVisitorPayment, useWaitlistEntries } from '@/features/participation/hooks/useParticipationQueries'
import { useSchedule, useSchedules } from '@/features/schedule/hooks/useScheduleQueries'
import { useSetHeaderActions } from '@/shared/components/HeaderActionsContext'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Separator } from '@/shared/components/ui/separator'
import type { Member, ParticipantItem, ScheduleListItem } from '@/shared/types/api'
import { formatDateLabel } from '@/shared/utils/dateGroup'
import { ArrowLeftRight, Banknote, Calendar, ClipboardCheck, Edit, ExternalLink, MapPin, Repeat, Trash2, User, UserPlus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * ActivityDetailPage — アクティビティ詳細画面
 *
 * 遷移パターン:
 *  1. コミュニティ詳細 > アクティビティタブ > 該当アクティビティ選択
 *  2. ユーザーのアクティビティタブ > 該当アクティビティ選択
 *
 * 表示項目:
 *  - 開催場所、日時、幹事
 *  - スケジュール一覧（参加費・参加者数・参加ボタン付き）
 */
export function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const scheduleIdParam = searchParams.get('schedule')
    const { data: activity, isLoading } = useActivity(id!)
    const deleteMutation = useDeleteActivity(activity?.communityId ?? '')
    const deleteMutationRef = useRef(deleteMutation)
    deleteMutationRef.current = deleteMutation
    const { data: schedulesData, isLoading: isSchedulesLoading, isError: isSchedulesError, error: schedulesError, refetch: refetchSchedules } = useSchedules(id!)
    const schedules = schedulesData?.schedules ?? []
    const { isAdminOrAbove } = useMyRole(activity?.communityId ?? '')
    const [showOrganizerDialog, setShowOrganizerDialog] = useState(false)

    // 表示対象のスケジュールを決定（scheduleIdParam 必須 — フォールバックなし）
    const activeSchedule = useMemo(() => {
        if (!scheduleIdParam || schedules.length === 0) return null
        return schedules.find((s) => s.id === scheduleIdParam) ?? null
    }, [schedules, scheduleIdParam])

    const activeIndex = activeSchedule ? schedules.findIndex((s) => s.id === activeSchedule.id) : -1

    const switchSchedule = (idx: number) => {
        const s = schedules[idx]
        if (s) setSearchParams({ schedule: s.id }, { replace: true })
    }

    // ヘッダーに編集・削除アイコンを設定（useMemo で参照安定化 — 0-2 fix）
    const headerActions = useMemo(
        () =>
            activity ? (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/activities/${id}/edit`)}
                        className="p-1.5 hover:bg-gray-100 rounded-md"
                        aria-label="編集"
                    >
                        <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('このアクティビティを削除しますか？')) {
                                await deleteMutationRef.current.mutateAsync(id!)
                                navigate(-1)
                            }
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-md"
                        aria-label="削除"
                    >
                        <Trash2 className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            ) : null,
        [activity, id, navigate]
    )
    useSetHeaderActions(headerActions)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!activity) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <p className="text-sm">アクティビティが見つかりません</p>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            {/* ── アクティビティ名 ── */}
            <h1 className="text-xl font-bold text-gray-900">{activity.title}</h1>

            {/* ── アクティビティ概要 ── */}
            {activity.description && (
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">アクティビティ概要</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{activity.description}</p>
                </div>
            )}

            {/* ── 情報セクション ── */}
            <div className="space-y-2 text-sm text-gray-700">
                {activity.communityName && (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>コミュニティ：{activity.communityName}</span>
                    </div>
                )}
                {activity.defaultLocation && activity.defaultLocation !== 'オンライン' && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>開催場所：{activity.defaultLocation}</span>
                    </div>
                )}
                {activity.defaultAddress && (
                    <div className="flex items-center gap-2 ml-6">
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.defaultAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                            Googleマップで開く
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
                {activeSchedule ? (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>
                            日時：{formatDateLabel(activeSchedule.date)} {activeSchedule.startTime} 〜 {activeSchedule.endTime}
                        </span>
                    </div>
                ) : (activity.defaultStartTime || activity.defaultEndTime) ? (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>
                            日時：{activity.defaultStartTime ?? '--:--'} 〜 {activity.defaultEndTime ?? '--:--'}
                        </span>
                    </div>
                ) : null}
                {/* 幹事 + 参加費 + チャットボタン (#33) */}
                <div className="flex items-stretch gap-3">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>幹事：{activity.organizerDisplayName ?? activity.organizerUserId ? (activity.organizerDisplayName ?? '—') : '未定'}</span>
                            {isAdminOrAbove && (
                                <button
                                    type="button"
                                    onClick={() => setShowOrganizerDialog(true)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    aria-label="幹事を変更"
                                >
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            )}
                        </div>
                        {/* 参加費（表示中のスケジュールから取得） */}
                        {activeSchedule && (
                            <div className="flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>
                                    参加費：{activeSchedule.participationFee != null && activeSchedule.participationFee > 0
                                        ? `¥${activeSchedule.participationFee.toLocaleString()}`
                                        : '無料'}
                                    {activeSchedule.visitorFee != null && activeSchedule.visitorFee !== activeSchedule.participationFee && (
                                        <span className="text-gray-500 ml-1">
                                            （ビジター：¥{activeSchedule.visitorFee.toLocaleString()}）
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    {/* チャットボタン: 幹事・参加費の右横に2行分の高さ */}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const { channelId } = await chatApi.getActivityChannel(id!)
                                navigate(`/chats/${channelId}`)
                            } catch {
                                // エラー時は何もしない
                            }
                        }}
                        className="flex items-center justify-center px-4 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shrink-0 text-xs font-medium whitespace-nowrap"
                    >
                        チャットを始める
                    </button>
                </div>
                {/* 繰り返し予定ナビ（recurrenceRule あり かつ 複数スケジュール時のみ） */}
                {activity.recurrenceRule && schedules.length > 1 && activeSchedule && (
                    <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">繰り返し予定：</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => switchSchedule(activeIndex - 1)}
                                disabled={activeIndex <= 0}
                                className="text-xs text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                                ← 前の予定
                            </button>
                            <span className="text-xs text-gray-400">
                                {activeIndex + 1} / {schedules.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => switchSchedule(activeIndex + 1)}
                                disabled={activeIndex >= schedules.length - 1}
                                className="text-xs text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                                次の予定 →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Separator />

            {/* ── スケジュール ── */}
            <div>
                {isSchedulesLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                ) : isSchedulesError ? (
                    <div className="text-center py-4 space-y-2">
                        <p className="text-sm text-red-500">スケジュールの取得に失敗しました</p>
                        <p className="text-xs text-gray-400">{(schedulesError as Error)?.message}</p>
                        <button
                            onClick={() => refetchSchedules()}
                            className="text-xs text-blue-600 underline"
                        >
                            再読み込み
                        </button>
                    </div>
                ) : !activeSchedule ? (
                    <p className="text-sm text-gray-400 text-center py-4">スケジュールが見つかりません</p>
                ) : (
                    <ScheduleSection
                        schedule={activeSchedule}
                        enabledPaymentMethods={activity.communityPaymentSettings?.enabledPaymentMethods}
                        paypayId={activity.communityPaymentSettings?.paypayId}
                        isAdminOrAbove={isAdminOrAbove}
                    />
                )}
            </div>

            {/* ── 幹事変更ダイアログ ── */}
            {activity && (
                <ChangeOrganizerDialog
                    activityId={id!}
                    communityId={activity.communityId}
                    open={showOrganizerDialog}
                    onOpenChange={setShowOrganizerDialog}
                />
            )}
        </div>
    )
}

// ─── スケジュール単位の参加セクション ────────────────────

function ScheduleSection({ schedule, enabledPaymentMethods, paypayId, isAdminOrAbove }: { schedule: ScheduleListItem; enabledPaymentMethods?: string[]; paypayId?: string | null; isAdminOrAbove?: boolean }) {
    const { data: participantsData } = useParticipants(schedule.id)
    const { data: waitlistData } = useWaitlistEntries(schedule.id)
    const confirmPaymentMutation = useConfirmPayment(schedule.id)
    const addGuestVisitorMutation = useAddGuestVisitor(schedule.id)
    const updateVisitorPaymentMutation = useUpdateVisitorPayment(schedule.id)
    // 個別スケジュールAPIで myStatus / attendingCount / waitlistCount を取得
    const { data: scheduleDetail, isLoading: isDetailLoading } = useSchedule(schedule.id)
    const participants = participantsData?.participants ?? []
    const waitlistEntries = waitlistData?.entries ?? []
    const isCancelled = schedule.status === 'CANCELLED'
    const remaining = schedule.capacity != null ? schedule.capacity - participants.length : null
    // #40: 一括確認ダイアログ
    const [showBulkConfirm, setShowBulkConfirm] = useState(false)
    const [showAddVisitor, setShowAddVisitor] = useState(false)
    const hasReportedPayments = participants.some((p) => p.paymentStatus === 'REPORTED')

    // #34: 過去アクティビティ判定（endTime を過ぎたらボタン非活性）
    const isExpired = (() => {
        if (!schedule.date || !schedule.endTime) return false
        const endDateTime = new Date(`${schedule.date}T${schedule.endTime}`)
        return endDateTime.getTime() < Date.now()
    })()

    const myStatus = scheduleDetail?.myStatus ?? 'none'
    const hasFee = (schedule.participationFee != null && schedule.participationFee > 0) || (schedule.visitorFee != null && schedule.visitorFee > 0)
    const isFull = schedule.capacity != null
        && (scheduleDetail?.attendingCount ?? participants.length) >= schedule.capacity

    return (
        <div className="border rounded-lg p-4 space-y-3">
            {isCancelled && (
                <div className="flex items-center">
                    <span className="text-xs text-red-500 font-normal bg-red-50 px-1.5 py-0.5 rounded">キャンセル済</span>
                </div>
            )}

            {/* 参加者一覧 */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-gray-600">
                        参加者一覧（{remaining != null ? `残り: ${remaining}/${schedule.capacity}` : `${participants.length}名`}）
                    </h3>
                    {!isCancelled && !isExpired && (
                        <button
                            type="button"
                            onClick={() => setShowAddVisitor(true)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            ゲスト追加
                        </button>
                    )}
                </div>
                <div className="border rounded overflow-hidden">
                    <div className="max-h-64 overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-2 py-1 text-left font-medium text-gray-600 w-8">No.</th>
                                    <th className="px-2 py-1 text-left font-medium text-gray-600">参加者</th>
                                    <th className="px-2 py-1 text-center font-medium text-gray-600 w-16">ビジター</th>
                                    {isAdminOrAbove && hasFee && <th className="px-2 py-1 text-center font-medium text-gray-600 w-20">支払い方法</th>}
                                    {isAdminOrAbove && hasFee && (
                                        <th className="px-2 py-1 text-center font-medium text-gray-600 w-20">
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                                支払い
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBulkConfirm(true)}
                                                    className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                                    aria-label="支払いを一括確認"
                                                    title="支払いを一括確認"
                                                >
                                                    <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                                                </button>
                                            </span>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const totalRows = schedule.capacity != null ? Math.max(schedule.capacity, participants.length) : Math.max(participants.length, 1)
                                    return Array.from({ length: totalRows }, (_, i) => {
                                        const p = participants[i] as ParticipantItem | undefined
                                        return (
                                            <tr key={p?.id ?? `empty-${i}`} className="border-b last:border-0">
                                                <td className="px-2 py-1 text-gray-600">{i + 1}</td>
                                                <td className="px-2 py-1 text-gray-900">
                                                    {p ? (
                                                        p.isGuestVisitor
                                                            ? <span>{p.visitorName ?? '—'} <span className="text-gray-400 text-[10px]">（ゲスト）</span></span>
                                                            : (p.displayName ?? (p.userId ? p.userId.slice(0, 8) : '—'))
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-2 py-1 text-center">
                                                    {p ? (p.isVisitor ? '✓' : '—') : <span className="text-gray-300">—</span>}
                                                </td>
                                                {isAdminOrAbove && hasFee && (
                                                    <td className="px-2 py-1 text-center">
                                                        {p?.paymentMethod ? (
                                                            <span className="text-gray-700">
                                                                {p.paymentMethod === 'CASH' ? '現金' : p.paymentMethod === 'PAYPAY' ? 'PayPay' : p.paymentMethod === 'STRIPE' ? 'カード' : '—'}
                                                            </span>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                )}
                                                {isAdminOrAbove && hasFee && (
                                                    <td className="px-2 py-1 text-center">
                                                        {p ? (
                                                            p.paymentStatus === 'CONFIRMED' ? (
                                                                <span className="text-green-600">済</span>
                                                            ) : p.paymentStatus === 'REPORTED' ? (
                                                                <button
                                                                    type="button"
                                                                    className="text-yellow-600 hover:text-green-600 underline underline-offset-2 transition-colors"
                                                                    onClick={() => confirmPaymentMutation.mutate(p.id)}
                                                                    disabled={confirmPaymentMutation.isPending}
                                                                >
                                                                    確認待ち
                                                                </button>
                                                            ) : p.paymentStatus === 'UNPAID' ? (
                                                                <span className="text-red-500">未済</span>
                                                            ) : p.paymentStatus === 'REFUND_PENDING' ? (
                                                                <span className="text-orange-500">返金待ち</span>
                                                            ) : p.paymentStatus === 'REFUNDED' ? (
                                                                <span className="text-gray-500">返金済</span>
                                                            ) : p.paymentStatus === 'NO_REFUND' ? (
                                                                <span className="text-gray-400">返金不要</span>
                                                            ) : '—'
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* キャンセル待ち一覧（参加上限がある場合のみ表示） */}
            {schedule.capacity != null && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-600 mb-1">
                        キャンセル待ち（{waitlistEntries.length}名）
                    </h3>
                    {waitlistEntries.length > 0 ? (
                        <div className="border rounded overflow-hidden">
                            <div className="max-h-40 overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-orange-50 border-b">
                                            <th className="px-2 py-1 text-left font-medium text-gray-600 w-8">No.</th>
                                            <th className="px-2 py-1 text-left font-medium text-gray-600">名前</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waitlistEntries.map((w, i) => (
                                            <tr key={w.id} className="border-b last:border-0">
                                                <td className="px-2 py-1 text-gray-600">{i + 1}</td>
                                                <td className="px-2 py-1 text-gray-900">{w.displayName ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400">キャンセル待ちはいません。</p>
                    )}
                </div>
            )}

            {/* 参加アクションボタン（scheduleDetail読込完了まで表示しない） */}
            {!isCancelled && (
                isExpired ? (
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-400">この予定は終了しました</p>
                    </div>
                ) : isDetailLoading ? (
                    <div className="flex justify-center py-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                ) : (
                    <ParticipationActionButton
                        scheduleId={schedule.id}
                        hasFee={hasFee}
                        participationFee={schedule.participationFee}
                        myStatus={myStatus}
                        isFull={isFull}
                        enabledPaymentMethods={enabledPaymentMethods}
                        isAdminOrAbove={isAdminOrAbove}
                        paypayId={paypayId}
                        myParticipationId={scheduleDetail?.myParticipationId}
                        myPaymentMethod={scheduleDetail?.myPaymentMethod}
                        myPaymentStatus={scheduleDetail?.myPaymentStatus}
                    />
                )
            )}

            {/* 管理者向け: 返金待ち一覧 */}
            {isAdminOrAbove && <RefundPendingSection scheduleId={schedule.id} />}

            {/* #40: 一括確認ダイアログ */}
            <BulkConfirmDialog
                scheduleId={schedule.id}
                participants={participants}
                open={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
            />

            {/* ゲストビジター追加ダイアログ */}
            <AddGuestVisitorDialog
                open={showAddVisitor}
                onOpenChange={setShowAddVisitor}
                onSubmit={async (visitorName) => {
                    await addGuestVisitorMutation.mutateAsync({ visitorName })
                    setShowAddVisitor(false)
                }}
                isPending={addGuestVisitorMutation.isPending}
            />
        </div>
    )
}

// ─── ゲストビジター追加ダイアログ ──────────────────────

function AddGuestVisitorDialog({
    open,
    onOpenChange,
    onSubmit,
    isPending,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (visitorName: string) => Promise<void>
    isPending: boolean
}) {
    const [name, setName] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        await onSubmit(name.trim())
        setName('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>ゲストビジター追加</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <label htmlFor="visitorName" className="text-sm font-medium text-gray-700">
                            ビジター名
                        </label>
                        <Input
                            id="visitorName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="名前を入力（最大50文字）"
                            maxLength={50}
                            autoFocus
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        アプリ未登録のゲスト参加者を追加します。支払い管理はあなたが行います。
                    </p>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isPending}
                            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                        >
                            {isPending ? '追加中...' : '追加'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── 幹事変更ダイアログ ────────────────────────────────

function ChangeOrganizerDialog({
    activityId,
    communityId,
    open,
    onOpenChange,
}: {
    activityId: string
    communityId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { data: membersData } = useMembers(communityId)
    const members = membersData?.members ?? []
    const changeOrganizerMutation = useChangeOrganizer(activityId, communityId)
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        if (!search.trim()) return members.slice(0, 10)
        const q = search.toLowerCase()
        return members.filter((m: Member) =>
            m.userId.toLowerCase().includes(q) ||
            (m.displayName && m.displayName.toLowerCase().includes(q))
        ).slice(0, 10)
    }, [members, search])

    const handleSelect = async (userId: string | null) => {
        await changeOrganizerMutation.mutateAsync({ organizerUserId: userId })
        onOpenChange(false)
        setSearch('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>幹事を変更</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="🔍 メンバーを検索"
                        className="text-sm"
                    />
                    <div className="max-h-60 overflow-auto space-y-1">
                        {/* 未定 */}
                        <button
                            type="button"
                            onClick={() => handleSelect(null)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left rounded"
                        >
                            <div className="w-6 h-6 bg-gray-100 rounded-full shrink-0 flex items-center justify-center text-xs text-gray-400">?</div>
                            <span className="text-gray-500">未定</span>
                        </button>
                        {filtered.map((m: Member) => (
                            <button
                                key={m.userId}
                                type="button"
                                onClick={() => handleSelect(m.userId)}
                                disabled={changeOrganizerMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left rounded disabled:opacity-50"
                            >
                                <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0" />
                                <span>{m.displayName ?? m.userId}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
