import { useMembers } from '@/features/community/hooks/useMemberQueries'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select'
import type { Member } from '@/shared/types/api'
import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

// ─── 定数 ────────────────────────────────────────────────

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const
const DAY_RRULE = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const

/** 選択中の日付から繰り返しオプションを動的に生成 */
function buildRepeatOptions(dateStr: string) {
    const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
    const dayIdx = d.getDay()
    const dayLabel = DAY_LABELS[dayIdx]
    const weekNum = Math.ceil(d.getDate() / 7)
    return [
        { value: 'none', label: '繰り返しなし' },
        { value: 'daily', label: '毎日' },
        { value: 'weekly', label: `毎週${dayLabel}曜日` },
        { value: 'monthly_nth', label: `毎月第${weekNum}${dayLabel}曜日` },
        { value: 'weekday', label: '毎週平日' },
        { value: 'custom', label: 'カスタム' },
    ]
}

/**
 * Repeat選択値からRRULE文字列へ変換するヘルパー
 * 'none' → null（繰り返しなし）
 */
function repeatToRRule(repeatValue: string, dateStr: string): string | null {
    const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
    const dayIdx = d.getDay()
    const dayRrule = DAY_RRULE[dayIdx]
    const weekNum = Math.ceil(d.getDate() / 7)
    switch (repeatValue) {
        case 'daily':
            return 'FREQ=DAILY'
        case 'weekly':
            return `FREQ=WEEKLY;BYDAY=${dayRrule}`
        case 'monthly_nth':
            return `FREQ=MONTHLY;BYDAY=${weekNum}${dayRrule}`
        case 'weekday':
            return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
        case 'custom':
            return 'FREQ=WEEKLY'
        case 'none':
        default:
            return null
    }
}

/**
 * RRULE文字列からRepeat選択値へ逆変換するヘルパー
 */
function rruleToRepeat(rrule: string | null | undefined): string {
    if (!rrule) return 'none'
    const upper = rrule.toUpperCase()
    if (upper === 'FREQ=DAILY') return 'daily'
    if (upper === 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR') return 'weekday'
    if (upper.startsWith('FREQ=WEEKLY;BYDAY=')) return 'weekly'
    if (upper.startsWith('FREQ=MONTHLY;BYDAY=')) return 'monthly_nth'
    return 'custom'
}

const VISIBILITY_OPTIONS = [
    { value: 'private', label: '非公開' },
    { value: 'public', label: '公開' },
] as const

/** 15 分刻みの時刻オプション (00:00 〜 23:45) */
const TIME_OPTIONS: { value: string; label: string }[] = (() => {
    const opts: { value: string; label: string }[] = []
    for (let h = 0; h < 24; h++) {
        for (const m of [0, 15, 30, 45]) {
            const hh = String(h).padStart(2, '0')
            const mm = String(m).padStart(2, '0')
            opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
        }
    }
    return opts
})()

// ─── Props ───────────────────────────────────────────────

export interface ActivityFormValues {
    title: string
    defaultLocation: string
    date: string
    organizerUserId: string
    repeat: string
    recurrenceRule: string | null
    visibility: string
    description: string
    defaultStartTime: string
    defaultEndTime: string
}

interface ActivityFormProps {
    communityId: string
    initialValues?: Partial<ActivityFormValues>
    submitLabel: string
    onSubmit: (values: ActivityFormValues) => void | Promise<void>
    isPending?: boolean
    /** 親から渡されるエラーメッセージ（API エラー等） */
    error?: string | null
}

/**
 * ActivityForm — アクティビティ作成/更新で共通利用するフォーム
 *
 * モックアップ準拠のフィールド:
 * - Activity Name / Location / Datetime
 * - Organizer (メンバー検索ドロップダウン)
 * - Repeat (UIのみ、送信なし)
 * - Visibility (UIのみ)
 */
export function ActivityForm({
    communityId,
    initialValues,
    submitLabel,
    onSubmit,
    isPending,
    error,
}: ActivityFormProps) {
    const [title, setTitle] = useState(initialValues?.title ?? '')
    const [description, setDescription] = useState(initialValues?.description ?? '')
    const [defaultLocation, setDefaultLocation] = useState(initialValues?.defaultLocation ?? '')
    const [date, setDate] = useState(initialValues?.date ?? '')
    const [organizerUserId, setOrganizerUserId] = useState(initialValues?.organizerUserId ?? '')
    const [organizerSearch, setOrganizerSearch] = useState('')
    const [showOrganizerDropdown, setShowOrganizerDropdown] = useState(false)
    const [repeat, setRepeat] = useState(initialValues?.repeat ?? rruleToRepeat(initialValues?.recurrenceRule))
    const [visibility, setVisibility] = useState(initialValues?.visibility ?? 'private')
    const [defaultStartTime, setDefaultStartTime] = useState(initialValues?.defaultStartTime ?? '')
    const [defaultEndTime, setDefaultEndTime] = useState(initialValues?.defaultEndTime ?? '')

    // Organizer 検索用のメンバー一覧
    const { data: membersData } = useMembers(communityId)
    const members = membersData?.members ?? []

    const filteredMembers = useMemo(() => {
        if (!organizerSearch.trim()) return members.slice(0, 5)
        const q = organizerSearch.toLowerCase()
        return members.filter((m: Member) =>
            m.userId.toLowerCase().includes(q) ||
            (m.displayName && m.displayName.toLowerCase().includes(q))
        ).slice(0, 5)
    }, [members, organizerSearch])

    const selectedMember = members.find((m: Member) => m.userId === organizerUserId)

    // 日付に基づく繰り返しオプション
    const repeatOptions = useMemo(() => buildRepeatOptions(date), [date])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        await onSubmit({
            title: title.trim(),
            description: description.trim(),
            defaultLocation: defaultLocation.trim(),
            date,
            organizerUserId,
            repeat,
            recurrenceRule: repeatToRRule(repeat, date),
            visibility,
            defaultStartTime,
            defaultEndTime,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-5">
            {/* アクティビティ名 */}
            <div className="space-y-1.5">
                <Label htmlFor="activityName">アクティビティ名</Label>
                <Input
                    id="activityName"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="アクティビティ名を入力"
                    required
                />
            </div>

            {/* 開催場所 */}
            <div className="space-y-1.5">
                <Label htmlFor="location">開催場所</Label>
                <Input
                    id="location"
                    value={defaultLocation}
                    onChange={(e) => setDefaultLocation(e.target.value)}
                    placeholder="開催場所を入力"
                />
            </div>

            {/* 日付 */}
            <div className="space-y-1.5">
                <Label htmlFor="date">日付</Label>
                <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {/* 開始時刻・終了時刻 (15分刻み) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>開始時刻</Label>
                    <Select value={defaultStartTime} onValueChange={setDefaultStartTime}>
                        <SelectTrigger>
                            <SelectValue placeholder="--:--" />
                        </SelectTrigger>
                        <SelectContent side="bottom" sideOffset={4}>
                            {TIME_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>終了時刻</Label>
                    <Select value={defaultEndTime} onValueChange={setDefaultEndTime}>
                        <SelectTrigger>
                            <SelectValue placeholder="--:--" />
                        </SelectTrigger>
                        <SelectContent side="bottom" sideOffset={4}>
                            {TIME_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 幹事 */}
            <div className="space-y-1.5">
                <Label>幹事</Label>
                <div className="relative">
                    <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                        {selectedMember && (
                            <span className="text-sm font-medium">{selectedMember.displayName ?? selectedMember.userId}</span>
                        )}
                        <Input
                            value={organizerSearch}
                            onChange={(e) => {
                                setOrganizerSearch(e.target.value)
                                setShowOrganizerDropdown(true)
                            }}
                            onFocus={() => setShowOrganizerDropdown(true)}
                            placeholder="🔍 メンバーを検索"
                            className="border-0 p-0 h-auto focus-visible:ring-0 text-sm flex-1"
                        />
                    </div>
                    {showOrganizerDropdown && filteredMembers.length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                            {filteredMembers.map((m: Member) => (
                                <button
                                    key={m.userId}
                                    type="button"
                                    onClick={() => {
                                        setOrganizerUserId(m.userId)
                                        setOrganizerSearch('')
                                        setShowOrganizerDropdown(false)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left"
                                >
                                    <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0" />
                                    <span>{m.displayName ?? m.userId}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 繰り返し */}
            <div className="space-y-1.5">
                <Label>繰り返し</Label>
                <Select value={repeat} onValueChange={setRepeat}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={4}>
                        {repeatOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 公開設定 */}
            <div className="space-y-1.5">
                <Label>公開設定</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={4}>
                        {VISIBILITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 説明 */}
            <div className="space-y-1.5">
                <Label htmlFor="description">説明</Label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="説明を入力"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Submit */}
            <div className="pt-2">
                <Button type="submit" className="w-full" disabled={!title.trim() || isPending}>
                    {isPending ? '処理中...' : submitLabel}
                </Button>
            </div>
        </form>
    )
}
