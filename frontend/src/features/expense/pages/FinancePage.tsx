import { useMyRole } from '@/features/community/hooks/useCommunityQueries'
import {
    useCreateExpense,
    useDeleteExpense,
    useExpenseCategories,
    useExpenses,
    useFinanceSummary,
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
import { PieChart, Plus, Receipt, Trash2, TrendingDown, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

type Tab = 'summary' | 'expenses'

/**
 * FinancePage — コミュニティの経費・収支管理画面
 *
 * /communities/:id/finance から遷移
 *
 * タブ構成:
 *  - 収支: サマリー表示（カテゴリ別支出合計）
 *  - 支出: 経費の一覧・追加・削除
 */
export function FinancePage() {
    const { id: communityId } = useParams<{ id: string }>()
    const { isAdminOrAbove } = useMyRole(communityId ?? '')
    const [activeTab, setActiveTab] = useState<Tab>('summary')

    if (!communityId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-sm">コミュニティが指定されていません</p>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            {/* タブ */}
            <div className="flex border-b">
                {([
                    { key: 'summary' as Tab, label: '収支', icon: <PieChart className="w-4 h-4" /> },
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
            {activeTab === 'summary' && <SummaryTab communityId={communityId} />}
            {activeTab === 'expenses' && <ExpensesTab communityId={communityId} isAdminOrAbove={isAdminOrAbove} />}
        </div>
    )
}

// ─── 収支タブ ─────────────────────────────────────────

function SummaryTab({ communityId }: { communityId: string }) {
    const { data, isLoading } = useFinanceSummary(communityId)

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

    const totalExpense = data.totalExpense ?? 0

    return (
        <div className="space-y-4">
            {/* 総支出 */}
            <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">総支出</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                    ¥{totalExpense.toLocaleString()}
                </p>
            </div>

            <Separator />

            {/* カテゴリ別内訳 */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    カテゴリ別支出
                </h3>
                {data.expensesByCategory.length > 0 ? (
                    <div className="space-y-2">
                        {data.expensesByCategory.map((cat) => {
                            const pct = totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0
                            return (
                                <div key={cat.categoryId} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-700 flex-1 truncate">{cat.categoryName}</span>
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-400 rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                                        ¥{cat.total.toLocaleString()}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">まだ支出が登録されていません。</p>
                )}
            </div>

            {/* 収入セクション（将来実装） */}
            <Separator />
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400">💡 収入（集金）の集計機能は今後追加予定です</p>
            </div>
        </div>
    )
}

// ─── 支出タブ ─────────────────────────────────────────

function ExpensesTab({ communityId, isAdminOrAbove }: { communityId: string; isAdminOrAbove: boolean }) {
    const { data: expensesData, isLoading } = useExpenses(communityId)
    const { data: categoriesData } = useExpenseCategories(communityId)
    const deleteMutation = useDeleteExpense(communityId)
    const [showCreate, setShowCreate] = useState(false)

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* 追加ボタン */}
            {isAdminOrAbove && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreate(true)}
                    className="w-full"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    支出を登録
                </Button>
            )}

            {/* 経費一覧 */}
            {expenses.length === 0 ? (
                <div className="text-center py-10">
                    <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">まだ支出が登録されていません</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="flex items-center gap-3 rounded-lg border px-3 py-2"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        {expense.categoryName || categoryMap.get(expense.categoryId) || '未分類'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {formatDateLabel(expense.date)}
                                    </span>
                                </div>
                                {expense.description && (
                                    <p className="text-sm text-gray-700 mt-0.5 truncate">{expense.description}</p>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-red-600 whitespace-nowrap">
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
            )}

            {/* 作成ダイアログ */}
            <CreateExpenseDialog
                communityId={communityId}
                categories={categories}
                open={showCreate}
                onOpenChange={setShowCreate}
            />
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
    const [categoryId, setCategoryId] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

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
                        {/* カスタムカテゴリボタン（将来実装） */}
                        <button
                            type="button"
                            disabled
                            className="text-xs text-gray-400 cursor-not-allowed"
                        >
                            ＋ カスタムカテゴリ追加（準備中）
                        </button>
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
