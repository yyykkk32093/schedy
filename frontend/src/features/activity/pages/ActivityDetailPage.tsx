import { useActivity, useDeleteActivity } from '@/features/activity/hooks/useActivityQueries'
import { useAttendSchedule, useParticipants } from '@/features/participation/hooks/useParticipationQueries'
import { useSchedules } from '@/features/schedule/hooks/useScheduleQueries'
import { useSetHeaderActions } from '@/shared/components/HeaderActionsContext'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import type { ParticipantItem, ScheduleListItem } from '@/shared/types/api'
import { Banknote, Calendar, Edit, MapPin, Trash2, User } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
    const { data: activity, isLoading } = useActivity(id!)
    const deleteMutation = useDeleteActivity(activity?.communityId ?? '')
    const deleteMutationRef = useRef(deleteMutation)
    deleteMutationRef.current = deleteMutation
    const { data: schedulesData, isLoading: isSchedulesLoading, isError: isSchedulesError, error: schedulesError, refetch: refetchSchedules } = useSchedules(id!)
    const schedules = schedulesData?.schedules ?? []

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

            {/* ── 情報セクション ── */}
            <div className="space-y-2 text-sm text-gray-700">
                {activity.defaultLocation && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>開催場所：{activity.defaultLocation}</span>
                    </div>
                )}
                {schedules.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>
                            日時：{schedules[0].date} {schedules[0].startTime} 〜 {schedules[0].endTime}
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
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>幹事：{activity.createdByDisplayName ?? activity.createdBy}</span>
                </div>
                {/* ── Description（幹事の下に表示） ── */}
                {activity.description && (
                    <div className="mt-2 pl-6">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                    </div>
                )}
                {/* 参加費（先頭スケジュールから取得） */}
                {schedules.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>
                            参加費：{schedules[0].participationFee != null && schedules[0].participationFee > 0
                                ? `¥${schedules[0].participationFee.toLocaleString()}`
                                : '無料'}
                        </span>
                    </div>
                )}
            </div>

            <Separator />

            {/* ── スケジュール一覧 ── */}
            <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-3">スケジュール</h2>
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
                ) : schedules.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">スケジュールがありません</p>
                ) : (
                    <div className="space-y-3">
                        {schedules.map((s) => (
                            <ScheduleSection key={s.id} schedule={s} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── スケジュール単位の参加セクション ────────────────────

function ScheduleSection({ schedule }: { schedule: ScheduleListItem }) {
    const { data: participantsData } = useParticipants(schedule.id)
    const attendMutation = useAttendSchedule(schedule.id)
    const participants = participantsData?.participants ?? []
    const isCancelled = schedule.status === 'CANCELLED'
    const remaining = schedule.capacity != null ? schedule.capacity - participants.length : null

    return (
        <div className="border rounded-lg p-4 space-y-3">
            {/* 参加者一覧 */}
            <div>
                <h3 className="text-xs font-semibold text-gray-600 mb-1">
                    参加者一覧（{remaining != null ? `残り: ${remaining}/${schedule.capacity}` : `${participants.length}名`}）
                </h3>
                {participants.length > 0 ? (
                    <div className="border rounded overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-2 py-1 text-left font-medium text-gray-600 w-8">No.</th>
                                    <th className="px-2 py-1 text-left font-medium text-gray-600">参加者</th>
                                    <th className="px-2 py-1 text-center font-medium text-gray-600 w-16">ビジター</th>
                                    <th className="px-2 py-1 text-center font-medium text-gray-600 w-16">支払い</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p: ParticipantItem, i: number) => (
                                    <tr key={p.id} className="border-b last:border-0">
                                        <td className="px-2 py-1 text-gray-600">{i + 1}</td>
                                        <td className="px-2 py-1 text-gray-900">{p.displayName ?? p.userId.slice(0, 8)}</td>
                                        <td className="px-2 py-1 text-center">
                                            {p.isVisitor ? '✓' : '—'}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            {p.paymentStatus === 'CONFIRMED' ? (
                                                <span className="text-green-600">✓</span>
                                            ) : p.paymentStatus === 'REPORTED' ? (
                                                <span className="text-yellow-600">報告済</span>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">まだ参加者がいません</p>
                )}
            </div>

            {/* 参加するボタン */}
            {!isCancelled && (
                <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    disabled={attendMutation.isPending}
                    onClick={() => attendMutation.mutate({})}
                >
                    {attendMutation.isPending ? '処理中...' : '参加する'}
                </Button>
            )}
            {attendMutation.isError && (
                <p className="text-xs text-red-500">{(attendMutation.error as Error).message}</p>
            )}
            {attendMutation.isSuccess && (
                <p className="text-xs text-green-600">参加登録しました ✓</p>
            )}
        </div>
    )
}
