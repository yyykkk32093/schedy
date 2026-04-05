import { useCommunity, useMyRole, useSubCommunities } from '@/features/community/hooks/useCommunityQueries'
import {
    useActivityIncomeDetail,
    useCreateExpense,
    useCreateExpenseCategory,
    useDeactivateExpenseCategory,
    useDeleteExpense,
    useExpenseCategories,
    useExpenses,
    useFinanceSummary,
    useFinanceSummaryTree,
    useIncome,
    useUpdateExpenseCategory,
} from '@/features/expense/hooks/useExpenseQueries'
import { Button } from '@/shared/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select'
import { Separator } from '@/shared/components/ui/separator'
import type { ExpenseCategory, ExpenseItem } from '@/shared/types/api'
import { formatDateLabel } from '@/shared/utils/dateGroup'
import { ChevronLeft, ChevronRight, Edit2, GitBranch, Plus, Receipt, Settings, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

type Tab = 'expenses' | 'income'
type PeriodMode = 'all' | 'month'
type FinanceScope = 'self' | 'tree'

/** 月の先頭と末尾をISO日付文字列で返す */
function getMonthRange(year: number, month: number): { from: string; to: string } {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    return { from, to }
}

/**
 * FinancePage — コミュニティの経費・収入管理画面
 *
 * /communities/:id/finance から遷移
 *
 * タブ構成 (D-2:C):
 *  - 支出: 経費の一覧・追加・削除（サマリーカード付き）
 *  - 収入: アクティビティ別の集金集計
 */
export function FinancePage() {
    const { id: communityId } = useParams<{ id: string }>()
    const { isAdminOrAbove } = useMyRole(communityId ?? '')
    const { data: community } = useCommunity(communityId ?? '')
    const { data: subCommData } = useSubCommunities(communityId ?? '', !!community)
    const isRootWithChildren = !community?.parentId && (subCommData?.children?.length ?? 0) > 0

    const [activeTab, setActiveTab] = useState<Tab>('income')
    const [scope, setScope] = useState<FinanceScope>('self')

    // W3-12: 期間フィルタ
    const now = new Date()
    const [periodMode, setPeriodMode] = useState<PeriodMode>('all')
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)

    const dateRange = useMemo(() => {
        if (periodMode === 'all') return undefined
        return getMonthRange(year, month)
    }, [periodMode, year, month])

    const handlePrevMonth = useCallback(() => {
        if (month === 1) {
            setMonth(12)
            setYear((y) => y - 1)
        } else {
            setMonth((m) => m - 1)
        }
    }, [month])

    const handleNextMonth = useCallback(() => {
        if (month === 12) {
            setMonth(1)
            setYear((y) => y + 1)
        } else {
            setMonth((m) => m + 1)
        }
    }, [month])

    const handleSetCurrentMonth = useCallback(() => {
        const d = new Date()
        setYear(d.getFullYear())
        setMonth(d.getMonth() + 1)
        setPeriodMode('month')
    }, [])

    if (!communityId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-sm">コミュニティが指定されていません</p>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            {/* スコープ切り替え（ルートコミュニティ＋子あり の場合のみ） */}
            {isRootWithChildren && (
                <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
                    <button
                        type="button"
                        onClick={() => setScope('self')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors ${scope === 'self' ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Wallet className="w-3.5 h-3.5" />
                        このコミュニティ
                    </button>
                    <button
                        type="button"
                        onClick={() => setScope('tree')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors ${scope === 'tree' ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <GitBranch className="w-3.5 h-3.5" />
                        全体統合
                    </button>
                </div>
            )}

            {/* 期間セレクタ (W3-12) */}
            <div className="flex items-center justify-between gap-2">
                {periodMode === 'month' ? (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
                            aria-label="前の月"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                            {year}年{month}月
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
                            aria-label="次の月"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <span className="text-sm font-medium text-gray-700">全期間</span>
                )}
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => setPeriodMode('all')}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodMode === 'all'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        全期間
                    </button>
                    <button
                        type="button"
                        onClick={handleSetCurrentMonth}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodMode === 'month'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        月別
                    </button>
                </div>
            </div>

            {/* 収支サマリー (凸型レイアウト: タブの上に表示) */}
            {scope === 'self' && <FinanceSummarySection communityId={communityId} dateRange={dateRange} />}
            {scope === 'tree' && <FinanceTreeSection communityId={communityId} dateRange={dateRange} />}

            {/* タブ（「このコミュニティ」スコープのみ） */}
            {scope === 'self' && (
                <>
                    <div className="flex border-b">
                        {([
                            { key: 'income' as Tab, label: '収入', icon: <TrendingUp className="w-4 h-4" /> },
                            { key: 'expenses' as Tab, label: '支出', icon: <TrendingDown className="w-4 h-4" /> },
                        ]).map(({ key, label, icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === key
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* タブ内容 */}
                    {activeTab === 'expenses' && <ExpensesTab communityId={communityId} isAdminOrAbove={isAdminOrAbove} dateRange={dateRange} />}
                    {activeTab === 'income' && <IncomeTab communityId={communityId} dateRange={dateRange} />}
                </>
            )}
        </div>
    )
}

// ─── 収支サマリーセクション（凸型レイアウト） ─────────────

function FinanceSummarySection({ communityId, dateRange }: { communityId: string; dateRange?: { from: string; to: string } }) {
    const { data: summaryData } = useFinanceSummary(communityId, dateRange)
    const { data: incomeData } = useIncome(communityId, dateRange)

    const totalExpense = summaryData?.totalExpense ?? 0
    const totalIncome = incomeData?.totalIncome ?? 0
    const balance = totalIncome - totalExpense
    const isPositive = balance >= 0

    return (
        <div className="space-y-3">
            {/* 収支（バランス） */}
            <div className={`rounded-lg border p-3 ${isPositive ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">収支</span>
                    </div>
                    <p className={`text-xl font-bold ${isPositive ? 'text-blue-700' : 'text-orange-700'}`}>
                        {isPositive ? '+' : ''}{balance.toLocaleString()}円
                    </p>
                </div>
            </div>
            {/* 収入・支出 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs font-semibold text-green-600">収入</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                        ¥{totalIncome.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-semibold text-red-600">支出</span>
                    </div>
                    <p className="text-lg font-bold text-red-700">
                        ¥{totalExpense.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─── 統合ビュー（全体統合スコープ） ────────────────────

function FinanceTreeSection({ communityId, dateRange }: { communityId: string; dateRange?: { from: string; to: string } | undefined }) {
    const { data, isLoading } = useFinanceSummaryTree(communityId, dateRange)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!data) {
        return <p className="text-sm text-gray-400 text-center py-10">データがありません</p>
    }

    const { totals, communities } = data
    const isPositive = totals.balance >= 0

    return (
        <div className="space-y-4">
            {/* 全体合計 */}
            <div className={`rounded-lg border p-4 ${isPositive ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">全体統合 収支</span>
                </div>
                <p className={`text-2xl font-bold ${isPositive ? 'text-blue-700' : 'text-orange-700'}`}>
                    {isPositive ? '+' : ''}{totals.balance.toLocaleString()}円
                </p>
                <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600">¥{totals.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs text-red-600">¥{totals.expense.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* コミュニティ別内訳 */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">コミュニティ別</h3>
                <div className="space-y-2">
                    {communities.map((c) => {
                        const balPositive = c.balance >= 0
                        return (
                            <div key={c.communityId} className="rounded-lg border bg-white p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 truncate">{c.communityName}</span>
                                    <span className={`text-sm font-semibold ${balPositive ? 'text-blue-600' : 'text-orange-600'}`}>
                                        {balPositive ? '+' : ''}{c.balance.toLocaleString()}円
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-green-500" />
                                        <span className="text-xs text-green-600">¥{c.income.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3 text-red-500" />
                                        <span className="text-xs text-red-600">¥{c.expense.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── 収入タブ (W3-11) ─────────────────────────────────

function IncomeTab({ communityId, dateRange }: { communityId: string; dateRange?: { from?: string; to?: string } }) {
    const { data, isLoading } = useIncome(communityId, dateRange)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!data) {
        return <p className="text-sm text-gray-400 text-center py-10">データがありません</p>
    }

    const totalIncome = data.totalIncome ?? 0

    return (
        <div className="space-y-4">
            {/* アクティビティ別内訳 */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    アクティビティ別収入
                </h3>
                {data.incomeByActivity.length > 0 ? (
                    <div className="space-y-2">
                        {data.incomeByActivity.map((item) => {
                            const pct = totalIncome > 0 ? Math.round((item.total / totalIncome) * 100) : 0
                            return (
                                <details
                                    key={item.activityId}
                                    className="group rounded-lg border"
                                    onToggle={(e) => {
                                        const open = (e.target as HTMLDetailsElement).open
                                        setExpandedIds((prev) => {
                                            const next = new Set(prev)
                                            if (open) next.add(item.activityId)
                                            else next.delete(item.activityId)
                                            return next
                                        })
                                    }}
                                >
                                    <summary className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{item.activityTitle}</span>
                                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-sm font-semibold text-green-600 w-24 text-right whitespace-nowrap">
                                            ¥{item.total.toLocaleString()}
                                        </span>
                                    </summary>
                                    <ActivityIncomeDetail
                                        communityId={communityId}
                                        activityId={item.activityId}
                                        dateRange={dateRange}
                                        isExpanded={expandedIds.has(item.activityId)}
                                    />
                                </details>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">まだ集金データがありません。</p>
                )}
            </div>
        </div>
    )
}

/** Activity 展開時のスケジュール別支払い詳細（遅延取得） */
function ActivityIncomeDetail({
    communityId,
    activityId,
    dateRange,
    isExpanded,
}: {
    communityId: string
    activityId: string
    dateRange?: { from?: string; to?: string }
    isExpanded: boolean
}) {
    const { data, isLoading } = useActivityIncomeDetail(
        communityId,
        isExpanded ? activityId : null,
        dateRange,
    )

    if (isLoading) {
        return (
            <div className="border-t px-3 py-4 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
            </div>
        )
    }

    if (!data || data.schedules.length === 0) {
        return (
            <div className="border-t px-3 py-3">
                <p className="text-xs text-gray-400">支払いデータがありません</p>
            </div>
        )
    }

    return (
        <div className="border-t divide-y">
            {data.schedules.map((schedule) => (
                <div key={schedule.scheduleId} className="px-3 py-2 bg-gray-50/50">
                    {/* スケジュール行 */}
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500">{schedule.label}</span>
                        <span className="text-xs font-semibold text-green-600">¥{schedule.total.toLocaleString()}</span>
                    </div>
                    {/* 個別支払い */}
                    <div className="space-y-0.5 pl-2">
                        {schedule.payments.map((payment, idx) => {
                            const visitorSuffix = payment.isGuest
                                ? '（ビジター・ゲスト）'
                                : payment.isVisitor
                                    ? '（ビジター）'
                                    : ''
                            const name = (payment.displayName ?? '名前なし') + visitorSuffix
                            return (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 truncate flex-1">{name}</span>
                                    <span className="text-xs text-gray-700 w-16 text-right">¥{payment.amount.toLocaleString()}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── 支出タブ ─────────────────────────────────────────

function ExpensesTab({ communityId, isAdminOrAbove, dateRange }: { communityId: string; isAdminOrAbove: boolean; dateRange?: { from?: string; to?: string } }) {
    const { data: expensesData, isLoading } = useExpenses(communityId, dateRange)
    const { data: categoriesData } = useExpenseCategories(communityId)
    const deleteMutation = useDeleteExpense(communityId)
    const [showCreate, setShowCreate] = useState(false)
    const [showCategoryManage, setShowCategoryManage] = useState(false)

    const expenses = expensesData?.expenses ?? []
    const categories = categoriesData?.categories ?? []

    // カテゴリIDからカテゴリ名のマッピング
    const categoryMap = useMemo(() => {
        const map = new Map<string, string>()
        categories.forEach((c) => map.set(c.id, c.name))
        return map
    }, [categories])

    const handleDelete = (expense: ExpenseItem) => {
        if (!confirm(`「${expense.description || expense.categoryName}」を削除しますか？`)) return
        deleteMutation.mutate(expense.id)
    }

    // カテゴリ別に経費をグルーピング
    const expensesByCategory = useMemo(() => {
        const map = new Map<string, { categoryName: string; expenses: ExpenseItem[]; total: number }>()
        for (const expense of expenses) {
            const catId = expense.categoryId || '__uncategorized__'
            const catName = expense.categoryName || categoryMap.get(expense.categoryId) || '未分類'
            if (!map.has(catId)) {
                map.set(catId, { categoryName: catName, expenses: [], total: 0 })
            }
            const group = map.get(catId)!
            group.expenses.push(expense)
            group.total += expense.amount
        }
        return Array.from(map.entries()).map(([categoryId, data]) => ({
            categoryId,
            ...data,
        }))
    }, [expenses, categoryMap])

    const totalExpense = expensesByCategory.reduce((sum, g) => sum + g.total, 0)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* カテゴリ別内訳（展開で個別経費＋削除） */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    カテゴリ別支出
                </h3>
                {expenses.length === 0 ? (
                    <div className="text-center py-10">
                        <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">まだ支出が登録されていません</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {expensesByCategory.map((group) => {
                            const pct = totalExpense > 0
                                ? Math.round((group.total / totalExpense) * 100) : 0
                            return (
                                <details key={group.categoryId} className="group rounded-lg border">
                                    <summary className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{group.categoryName}</span>
                                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-sm font-semibold text-red-600 w-24 text-right whitespace-nowrap">
                                            -¥{group.total.toLocaleString()}
                                        </span>
                                    </summary>
                                    <div className="border-t divide-y">
                                        {group.expenses.map((expense) => (
                                            <div key={expense.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50/50">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400">
                                                            {formatDateLabel(expense.date)}
                                                        </span>
                                                    </div>
                                                    {expense.description && (
                                                        <p className="text-sm text-gray-700 mt-0.5 truncate">{expense.description}</p>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-red-600 whitespace-nowrap">
                                                    -¥{expense.amount.toLocaleString()}
                                                </span>
                                                {isAdminOrAbove && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(expense)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                        aria-label="削除"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* 追加ボタン（最下部） */}
            {isAdminOrAbove && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreate(true)}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        支出を登録
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCategoryManage(true)}
                        title="カテゴリ管理"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* 作成ダイアログ */}
            <CreateExpenseDialog
                communityId={communityId}
                categories={categories}
                open={showCreate}
                onOpenChange={setShowCreate}
            />

            {/* カテゴリ管理ダイアログ */}
            {isAdminOrAbove && (
                <CategoryManageDialog
                    communityId={communityId}
                    categories={categories}
                    open={showCategoryManage}
                    onOpenChange={setShowCategoryManage}
                />
            )}

        </div>
    )
}

// ─── 経費作成ダイアログ ──────────────────────────────────

function CreateExpenseDialog({
    communityId,
    categories,
    open,
    onOpenChange,
}: {
    communityId: string
    categories: ExpenseCategory[]
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const createMutation = useCreateExpense(communityId)
    const createCategoryMutation = useCreateExpenseCategory(communityId)
    const [categoryId, setCategoryId] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const activeCategories = categories.filter((c) => c.isActive)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoryId || !amount || !date) return
        await createMutation.mutateAsync({
            categoryId,
            amount: Number(amount),
            description: description.trim() || undefined,
            date,
        })
        // リセット
        setCategoryId('')
        setAmount('')
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        onOpenChange(false)
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return
        const result = await createCategoryMutation.mutateAsync({ name: newCategoryName.trim() })
        setCategoryId(result.categoryId)
        setNewCategoryName('')
        setShowNewCategory(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>支出を登録</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* カテゴリ */}
                    <div className="space-y-1.5">
                        <Label>カテゴリ</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="カテゴリを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* カスタムカテゴリ追加 */}
                        {showNewCategory ? (
                            <div className="flex items-center gap-1.5">
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="カテゴリ名"
                                    maxLength={50}
                                    className="h-7 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                                    className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap disabled:opacity-50"
                                >
                                    {createCategoryMutation.isPending ? '作成中...' : '追加'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowNewCategory(true)}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                ＋ カスタムカテゴリを追加
                            </button>
                        )}
                    </div>

                    {/* 金額 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="expenseAmount">金額（円）</Label>
                        <Input
                            id="expenseAmount"
                            type="number"
                            min={0}
                            step={1}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            required
                        />
                    </div>

                    {/* 日付 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="expenseDate">日付</Label>
                        <Input
                            id="expenseDate"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* 説明 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="expenseDescription">説明（任意）</Label>
                        <Input
                            id="expenseDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="メモを入力"
                            maxLength={200}
                        />
                    </div>

                    {/* 送信 */}
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
                            disabled={!categoryId || !amount || !date || createMutation.isPending}
                            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                        >
                            {createMutation.isPending ? '登録中...' : '登録'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── カテゴリ管理ダイアログ ────────────────────────────────

function CategoryManageDialog({
    communityId,
    categories,
    open,
    onOpenChange,
}: {
    communityId: string
    categories: ExpenseCategory[]
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const updateMutation = useUpdateExpenseCategory(communityId)
    const deactivateMutation = useDeactivateExpenseCategory(communityId)
    const createMutation = useCreateExpenseCategory(communityId)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [showAdd, setShowAdd] = useState(false)
    const [newName, setNewName] = useState('')

    const customCategories = categories.filter((c) => !c.isSystem && c.isActive)

    const startEdit = (cat: ExpenseCategory) => {
        setEditingId(cat.id)
        setEditName(cat.name)
    }

    const handleRename = async (categoryId: string) => {
        if (!editName.trim()) return
        await updateMutation.mutateAsync({ categoryId, name: editName.trim() })
        setEditingId(null)
        setEditName('')
    }

    const handleDeactivate = async (cat: ExpenseCategory) => {
        if (!confirm(`カテゴリ「${cat.name}」を削除しますか？\nこのカテゴリの支出は「未分類」に振り替えられます。`)) return
        await deactivateMutation.mutateAsync(cat.id)
    }

    const handleAdd = async () => {
        if (!newName.trim()) return
        await createMutation.mutateAsync({ name: newName.trim() })
        setNewName('')
        setShowAdd(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>カテゴリ管理</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* システムカテゴリ（読み取り専用） */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">デフォルトカテゴリ</p>
                        {categories.filter((c) => c.isSystem && c.isActive).map((cat) => (
                            <div key={cat.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50">
                                <span className="text-sm text-gray-600 flex-1">{cat.name}</span>
                                <span className="text-[10px] text-gray-400">システム</span>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* カスタムカテゴリ */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">カスタムカテゴリ</p>

                        {customCategories.length === 0 && !showAdd && (
                            <p className="text-xs text-gray-400 py-1">カスタムカテゴリはまだありません</p>
                        )}

                        {customCategories.map((cat) => (
                            <div key={cat.id} className="flex items-center gap-2">
                                {editingId === cat.id ? (
                                    <>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            maxLength={50}
                                            className="h-7 text-xs flex-1"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(cat.id)
                                                if (e.key === 'Escape') setEditingId(null)
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRename(cat.id)}
                                            disabled={!editName.trim() || updateMutation.isPending}
                                            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                        >
                                            保存
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="text-xs text-gray-400 hover:text-gray-600"
                                        >
                                            ×
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm text-gray-700 flex-1 truncate">{cat.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(cat)}
                                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="編集"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeactivate(cat)}
                                            disabled={deactivateMutation.isPending}
                                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                            aria-label="削除"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}

                        {/* 新規追加 */}
                        {showAdd ? (
                            <div className="flex items-center gap-1.5">
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="カテゴリ名"
                                    maxLength={50}
                                    className="h-7 text-xs flex-1"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAdd()
                                        if (e.key === 'Escape') { setShowAdd(false); setNewName('') }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={!newName.trim() || createMutation.isPending}
                                    className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? '作成中...' : '追加'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAdd(false); setNewName('') }}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowAdd(true)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                カスタムカテゴリを追加
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}