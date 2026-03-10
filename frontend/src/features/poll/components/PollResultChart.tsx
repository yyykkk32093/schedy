import type { PollResult } from '@/features/poll/api/pollApi'
import { useCastVote } from '@/features/poll/hooks/usePollQueries'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { CheckCircle2, Clock, Users } from 'lucide-react'
import { useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface PollResultChartProps {
    poll: PollResult
}

/**
 * PollResultChart — 投票結果チャート + 投票 UI（UBL-34）
 *
 * - 未投票ユーザー: 選択肢を選んで投票できる
 * - 投票済みユーザー: 棒グラフで結果を閲覧（自分の投票をハイライト）
 * - 締切超過: 投票ボタン非活性
 */
export function PollResultChart({ poll }: PollResultChartProps) {
    const castVote = useCastVote(poll.id, poll.communityId)
    const [selectedOptions, setSelectedOptions] = useState<string[]>([])

    const hasVoted = poll.myVotedOptionIds.length > 0
    const isExpired = poll.deadline ? new Date(poll.deadline) < new Date() : false

    // ── 選択肢トグル ──
    const toggleOption = (optionId: string) => {
        if (hasVoted || isExpired) return
        setSelectedOptions((prev) => {
            if (poll.isMultipleChoice) {
                return prev.includes(optionId)
                    ? prev.filter((id) => id !== optionId)
                    : [...prev, optionId]
            }
            return prev.includes(optionId) ? [] : [optionId]
        })
    }

    const handleVote = () => {
        if (selectedOptions.length === 0) return
        castVote.mutate(selectedOptions)
    }

    // ── チャート用データ ──
    const chartData = poll.options
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((opt) => ({
            name: opt.text.length > 12 ? `${opt.text.slice(0, 12)}…` : opt.text,
            votes: opt.voteCount,
        }))

    return (
        <Card className="p-4 space-y-4">
            {/* 質問 */}
            <div>
                <h3 className="font-semibold text-lg">{poll.question}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {poll.totalVotes}票
                    </span>
                    {poll.isMultipleChoice && <span className="text-blue-500">複数選択可</span>}
                    {poll.deadline && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {isExpired ? '終了済み' : `〜 ${new Date(poll.deadline).toLocaleDateString('ja-JP')}`}
                        </span>
                    )}
                </div>
            </div>

            {/* 棒グラフ（投票済み or 締切超過で表示） */}
            {(hasVoted || isExpired) && poll.totalVotes > 0 && (
                <ResponsiveContainer width="100%" height={Math.max(140, chartData.length * 36)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fontSize: 11 }}
                        />
                        <Tooltip formatter={(value) => [`${value}票`, '得票数']} />
                        <Bar dataKey="votes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}

            {/* 選択肢リスト + 投票ボタン */}
            <div className="space-y-2">
                {poll.options
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((opt) => {
                        const isMyVote = poll.myVotedOptionIds.includes(opt.id)
                        const isSelected = selectedOptions.includes(opt.id)
                        const pct =
                            poll.totalVotes > 0
                                ? Math.round((opt.voteCount / poll.totalVotes) * 100)
                                : 0

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                disabled={hasVoted || isExpired}
                                onClick={() => toggleOption(opt.id)}
                                className={`relative w-full text-left rounded-lg border p-3 transition-colors overflow-hidden ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : isMyVote
                                            ? 'border-blue-400 bg-blue-50/60'
                                            : 'border-gray-200 hover:border-gray-300'
                                    } ${hasVoted || isExpired ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {/* プログレスバー背景 */}
                                {(hasVoted || isExpired) && (
                                    <div
                                        className="absolute inset-y-0 left-0 bg-blue-100/60 transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                )}

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isMyVote && (
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                                        )}
                                        <span className="text-sm">{opt.text}</span>
                                    </div>
                                    {(hasVoted || isExpired) && (
                                        <span className="text-xs text-gray-500 ml-2 shrink-0">
                                            {opt.voteCount}票 ({pct}%)
                                        </span>
                                    )}
                                </div>

                                {/* 投票者アバター */}
                                {(hasVoted || isExpired) && opt.voters.length > 0 && (
                                    <div className="relative flex items-center gap-1 mt-2 flex-wrap">
                                        {opt.voters.slice(0, 5).map((v) => (
                                            <Avatar key={v.userId} className="w-5 h-5">
                                                <AvatarImage src={v.avatarUrl ?? undefined} />
                                                <AvatarFallback className="text-[8px]">
                                                    {(v.displayName ?? '?').slice(0, 1)}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {opt.voters.length > 5 && (
                                            <span className="text-[10px] text-gray-400 ml-1">
                                                +{opt.voters.length - 5}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        )
                    })}
            </div>

            {/* 投票送信ボタン */}
            {!hasVoted && !isExpired && (
                <Button
                    className="w-full"
                    disabled={selectedOptions.length === 0 || castVote.isPending}
                    onClick={handleVote}
                >
                    {castVote.isPending ? '送信中...' : '投票する'}
                </Button>
            )}
        </Card>
    )
}
