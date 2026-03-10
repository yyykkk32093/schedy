import {
    useAbsenceReport,
    useCommunityStats,
    useExportAccounting,
    useExportParticipationCsv,
    useParticipationTrend,
} from '@/features/analytics/hooks/useAnalyticsQueries'
import { Button } from '@/shared/components/ui/button'
import {
    BarChart3,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Lock,
    TrendingUp,
    UserX,
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

/**
 * AnalyticsTab — コミュニティ統計タブ（Phase 4 / UBL-17〜21）
 *
 * PREMIUM グレードのみ表示。FREE の場合はアップグレード導線。
 */
export function AnalyticsTab() {
    const { id: communityId } = useParams<{ id: string }>()
    const [activeSection, setActiveSection] = useState<
        'overview' | 'trend' | 'absences' | 'export'
    >('overview')

    const { data: stats, isLoading: statsLoading, error: statsError } = useCommunityStats(communityId!)
    const { data: trend, isLoading: trendLoading } = useParticipationTrend(communityId!)
    const { data: absenceReport, isLoading: absencesLoading } = useAbsenceReport(communityId!)

    const exportCsv = useExportParticipationCsv()
    const exportAccounting = useExportAccounting()
    const [exporting, setExporting] = useState(false)

    // ── Feature Gate: PREMIUM 制限 ──
    if (statsError && 'status' in statsError && (statsError as { status: number }).status === 403) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">統計・分析機能</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                    この機能は PREMIUM グレードのコミュニティでご利用いただけます
                </p>
                <Button size="sm" onClick={() => window.location.href = '/paywall'}>
                    プランを確認
                </Button>
            </div>
        )
    }

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        )
    }

    const handleExport = async (type: 'csv' | 'accounting-csv' | 'accounting-pdf') => {
        setExporting(true)
        try {
            if (type === 'csv') {
                await exportCsv(communityId!)
            } else if (type === 'accounting-csv') {
                await exportAccounting(communityId!, { format: 'csv' })
            } else {
                await exportAccounting(communityId!, { format: 'pdf' })
            }
        } finally {
            setExporting(false)
        }
    }

    // ── ナビゲーション ──
    const sections = [
        { key: 'overview' as const, label: '概要', icon: BarChart3 },
        { key: 'trend' as const, label: '推移', icon: TrendingUp },
        { key: 'absences' as const, label: '欠席', icon: UserX },
        { key: 'export' as const, label: '出力', icon: Download },
    ]

    return (
        <div className="space-y-4">
            {/* セクション切り替え */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {sections.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${activeSection === key
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── 概要セクション（UBL-17） ── */}
            {activeSection === 'overview' && stats && (
                <div className="space-y-4">
                    {/* サマリーカード */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="メンバー" value={stats.totalMembers} />
                        <StatCard label="アクティビティ" value={stats.totalActivities} />
                        <StatCard label="スケジュール" value={stats.totalSchedules} />
                        <StatCard
                            label="参加率"
                            value={`${stats.overallAttendanceRate}%`}
                        />
                    </div>

                    {/* Activity別参加率 棒グラフ */}
                    {stats.byActivity.length > 0 && (
                        <div className="bg-white rounded-lg border p-4">
                            <h4 className="text-sm font-semibold mb-3">
                                アクティビティ別 参加率
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={stats.byActivity}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="activityTitle"
                                        tick={{ fontSize: 10 }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        domain={[0, 100]}
                                        unit="%"
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, '参加率']}
                                    />
                                    <Bar
                                        dataKey="attendanceRate"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* 月別参加者数 */}
                    {stats.byMonth.length > 0 && (
                        <div className="bg-white rounded-lg border p-4">
                            <h4 className="text-sm font-semibold mb-3">
                                月別 参加者数
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={stats.byMonth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar
                                        dataKey="totalAttending"
                                        name="参加者数"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* ── 推移セクション（UBL-19） ── */}
            {activeSection === 'trend' && (
                <div className="space-y-4">
                    {trendLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                    ) : trend && trend.trend.length > 0 ? (
                        <>
                            <div className="bg-white rounded-lg border p-4">
                                <h4 className="text-sm font-semibold mb-3">
                                    月別 ユニーク参加者数
                                </h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={trend.trend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10 }}
                                        />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="uniqueParticipants"
                                            name="ユニーク参加者"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="newParticipants"
                                            name="新規参加者"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-lg border p-4">
                                <h4 className="text-sm font-semibold mb-3">
                                    月別 総参加回数
                                </h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={trend.trend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10 }}
                                        />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar
                                            dataKey="totalAttendances"
                                            name="参加回数"
                                            fill="#8b5cf6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">
                            推移データがありません
                        </p>
                    )}
                </div>
            )}

            {/* ── 欠席セクション（UBL-18） ── */}
            {activeSection === 'absences' && (
                <div className="space-y-4">
                    {absencesLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                    ) : absenceReport ? (
                        <>
                            {/* サマリ */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    label="総キャンセル"
                                    value={absenceReport.summary.totalCancellations}
                                />
                                <StatCard
                                    label="当日キャンセル"
                                    value={absenceReport.summary.sameDayCancellations}
                                    highlight
                                />
                            </div>

                            {/* 常習者ランキング */}
                            {absenceReport.summary.frequentCancellers.length > 0 && (
                                <div className="bg-white rounded-lg border p-4">
                                    <h4 className="text-sm font-semibold mb-3">
                                        キャンセル回数ランキング
                                    </h4>
                                    <div className="space-y-2">
                                        {absenceReport.summary.frequentCancellers
                                            .slice(0, 10)
                                            .map((c, i) => (
                                                <div
                                                    key={c.userId}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="text-gray-700">
                                                        {i + 1}. {c.displayName ?? '不明'}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {c.cancelCount}回
                                                        {c.sameDayCancelCount > 0 && (
                                                            <span className="text-red-500 ml-1">
                                                                (当日{c.sameDayCancelCount})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* 直近のキャンセル一覧 */}
                            {absenceReport.items.length > 0 && (
                                <div className="bg-white rounded-lg border p-4">
                                    <h4 className="text-sm font-semibold mb-3">
                                        直近のキャンセル
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {absenceReport.items.slice(0, 30).map((item) => (
                                            <div
                                                key={item.participationId}
                                                className="flex items-center justify-between text-xs border-b pb-1"
                                            >
                                                <div>
                                                    <span className="font-medium">
                                                        {item.displayName ?? '不明'}
                                                    </span>
                                                    <span className="text-gray-400 ml-2">
                                                        {item.activityTitle}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-500">
                                                        {item.scheduleDate}
                                                    </span>
                                                    {item.isSameDayCancel && (
                                                        <span className="ml-1 text-red-500 font-medium">
                                                            当日
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {absenceReport.items.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    キャンセルデータがありません
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
            )}

            {/* ── 出力セクション（UBL-20/21） ── */}
            {activeSection === 'export' && (
                <div className="space-y-3">
                    <div className="bg-white rounded-lg border p-4">
                        <h4 className="text-sm font-semibold mb-4">データ出力</h4>
                        <div className="space-y-3">
                            <ExportButton
                                icon={FileSpreadsheet}
                                label="参加状況 CSV"
                                description="全参加者のステータス・支払い状況をCSVで出力"
                                loading={exporting}
                                onClick={() => handleExport('csv')}
                            />
                            <ExportButton
                                icon={FileSpreadsheet}
                                label="会計情報 CSV"
                                description="アクティビティ別の収支をCSVで出力"
                                loading={exporting}
                                onClick={() => handleExport('accounting-csv')}
                            />
                            <ExportButton
                                icon={FileText}
                                label="会計レポート PDF"
                                description="印刷用の会計レポートをPDFで出力"
                                loading={exporting}
                                onClick={() => handleExport('accounting-pdf')}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── サブコンポーネント ──

function StatCard({
    label,
    value,
    highlight,
}: {
    label: string
    value: string | number
    highlight?: boolean
}) {
    return (
        <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p
                className={`text-xl font-bold mt-0.5 ${highlight ? 'text-red-600' : 'text-gray-900'
                    }`}
            >
                {value}
            </p>
        </div>
    )
}

function ExportButton({
    icon: Icon,
    label,
    description,
    loading,
    onClick,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
    loading: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
        >
            <Icon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </button>
    )
}
