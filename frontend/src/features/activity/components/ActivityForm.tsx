import { useAuth } from '@/app/providers/AuthProvider'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

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

/** 15 分刻みの時刻オプション (09:00 〜 翌 08:45 の順で表示) */
const TIME_OPTIONS: { value: string; label: string }[] = (() => {
    const opts: { value: string; label: string }[] = []
    // 9:00 〜 23:45
    for (let h = 9; h < 24; h++) {
        for (const m of [0, 15, 30, 45]) {
            const hh = String(h).padStart(2, '0')
            const mm = String(m).padStart(2, '0')
            opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
        }
    }
    // 0:00 〜 8:45
    for (let h = 0; h < 9; h++) {
        for (const m of [0, 15, 30, 45]) {
            const hh = String(h).padStart(2, '0')
            const mm = String(m).padStart(2, '0')
            opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
        }
    }
    return opts
})()

// ─── Zod Schema ──────────────────────────────────────────

/** HH:mm に minutes を加算して HH:mm を返す */
function addMinutesToTime(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + minutes
    const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
    const mm = String(total % 60).padStart(2, '0')
    return `${hh}:${mm}`
}

const activityFormSchema = z.object({
    title: z.string().min(1, 'アクティビティ名を入力してください'),
    description: z.string(),
    defaultLocation: z.string(),
    defaultAddress: z.string(),
    date: z.string(),
    defaultStartTime: z.string(),
    defaultEndTime: z.string(),
    organizerUserId: z.string(),
    repeat: z.string(),
    visibility: z.string(),
    participationFee: z.string(),
    isOnline: z.boolean(),
    meetingUrl: z.string(),
    hasCapacity: z.boolean(),
    capacity: z.string(),
}).refine(
    (data) => {
        if (data.defaultStartTime && data.defaultEndTime) {
            return data.defaultStartTime < data.defaultEndTime
        }
        return true
    },
    {
        message: '終了時刻は開始時刻より後にしてください',
        path: ['defaultEndTime'],
    },
)

type ActivityFormSchema = z.infer<typeof activityFormSchema>

// ─── Props ───────────────────────────────────────────────

export interface ActivityFormValues {
    title: string
    defaultLocation: string
    defaultAddress: string
    date: string
    organizerUserId: string
    repeat: string
    recurrenceRule: string | null
    visibility: string
    description: string
    defaultStartTime: string
    defaultEndTime: string
    participationFee: number | null
    isOnline: boolean
    meetingUrl: string | null
    capacity: number | null
}

interface ActivityFormProps {
    communityId: string
    initialValues?: Partial<ActivityFormValues>
    submitLabel: string
    onSubmit: (values: ActivityFormValues) => void | Promise<void>
    isPending?: boolean
    /** 親から渡されるエラーメッセージ（API エラー等） */
    error?: string | null
    /** true の場合、過去日付のバリデーションをスキップ（編集時に既存の日付を保持する場合） */
    allowPastDate?: boolean
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
    allowPastDate,
}: ActivityFormProps) {
    const { user } = useAuth()
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ActivityFormSchema>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: {
            title: initialValues?.title ?? '',
            description: initialValues?.description ?? '',
            defaultLocation: initialValues?.defaultLocation ?? '',
            defaultAddress: initialValues?.defaultAddress ?? '',
            date: initialValues?.date ?? '',
            defaultStartTime: initialValues?.defaultStartTime ?? '',
            defaultEndTime: initialValues?.defaultEndTime ?? '',
            organizerUserId: initialValues?.organizerUserId ?? user?.userId ?? '',
            repeat: initialValues?.repeat ?? rruleToRepeat(initialValues?.recurrenceRule),
            visibility: initialValues?.visibility ?? 'private',
            participationFee: initialValues?.participationFee != null ? String(initialValues.participationFee) : '',
            isOnline: initialValues?.isOnline ?? false,
            meetingUrl: initialValues?.meetingUrl ?? '',
            hasCapacity: initialValues?.capacity != null,
            capacity: initialValues?.capacity != null ? String(initialValues.capacity) : '',
        },
    })

    const [organizerSearch, setOrganizerSearch] = useState('')
    const [showOrganizerDropdown, setShowOrganizerDropdown] = useState(false)
    const [isCustomCapacity, setIsCustomCapacity] = useState(() => {
        // 初期値が既存候補にない場合はカスタム入力モードにする
        if (initialValues?.capacity == null) return false
        return true // 初回は capacityOptions 未確定なので後で再判定
    })

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

    const organizerUserId = watch('organizerUserId')
    const selectedMember = members.find((m: Member) => m.userId === organizerUserId)

    // 日付に基づく繰り返しオプション
    const date = watch('date')
    const repeatOptions = useMemo(() => buildRepeatOptions(date), [date])

    // 過去日付制限用の today
    const today = useMemo(() => new Date().toISOString().split('T')[0], [])

    // メンバー数に基づく定員候補 (20%刻み)
    const capacityOptions = useMemo(() => {
        const count = members.length
        if (count === 0) return [5, 10, 15, 20, 25, 30]
        const step = Math.max(1, Math.round(count * 0.2))
        const opts: number[] = []
        for (let i = step; i <= count + step; i += step) {
            opts.push(i)
        }
        return opts
    }, [members.length])

    // capacityOptions が確定したら、初期値がリストにあるか再判定
    const capacityVal = watch('capacity')
    const resolvedIsCustom = useMemo(() => {
        if (!watch('hasCapacity') || !capacityVal) return false
        return !capacityOptions.includes(Number(capacityVal))
    }, [capacityOptions, capacityVal])

    const onFormSubmit = async (data: ActivityFormSchema) => {
        await onSubmit({
            title: data.title.trim(),
            description: data.description.trim(),
            defaultLocation: data.isOnline ? 'オンライン' : data.defaultLocation.trim(),
            defaultAddress: data.isOnline ? '' : data.defaultAddress.trim(),
            date: data.date,
            organizerUserId: data.organizerUserId,
            repeat: data.repeat,
            recurrenceRule: repeatToRRule(data.repeat, data.date),
            visibility: data.visibility,
            defaultStartTime: data.defaultStartTime,
            defaultEndTime: data.defaultEndTime,
            participationFee: data.participationFee ? Number(data.participationFee) : null,
            isOnline: data.isOnline,
            meetingUrl: data.isOnline && data.meetingUrl.trim() ? data.meetingUrl.trim() : null,
            capacity: data.hasCapacity && data.capacity ? Number(data.capacity) : null,
        })
    }

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="max-w-lg mx-auto px-4 py-6 space-y-5">
            {/* アクティビティ名 */}
            <div className="space-y-1.5">
                <Label htmlFor="activityName">アクティビティ名</Label>
                <Input
                    id="activityName"
                    placeholder="アクティビティ名を入力"
                    {...register('title')}
                />
                {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
            </div>

            {/* 開催形式 */}
            <div className="space-y-1.5">
                <Label>開催形式</Label>
                <Controller
                    name="isOnline"
                    control={control}
                    render={({ field }) => (
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!field.value}
                                    onChange={() => field.onChange(false)}
                                    className="accent-blue-600"
                                />
                                オフライン
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    checked={field.value}
                                    onChange={() => field.onChange(true)}
                                    className="accent-blue-600"
                                />
                                オンライン
                            </label>
                        </div>
                    )}
                />
            </div>
            {watch('isOnline') && (
                <div className="space-y-1.5">
                    <Label htmlFor="meetingUrl">会議URL（任意）</Label>
                    <Input
                        id="meetingUrl"
                        type="url"
                        placeholder="https://..."
                        {...register('meetingUrl')}
                    />
                </div>
            )}

            {/* 開催場所（オフライン時のみ表示） */}
            {!watch('isOnline') && (
                <div className="space-y-1.5">
                    <Label htmlFor="location">開催場所</Label>
                    <Input
                        id="location"
                        placeholder="開催場所を入力"
                        {...register('defaultLocation')}
                    />
                </div>
            )}

            {/* 開催場所住所（オフライン時のみ表示） */}
            {!watch('isOnline') && (
                <div className="space-y-1.5">
                    <Label htmlFor="defaultAddress">開催場所住所（任意）</Label>
                    <Input
                        id="defaultAddress"
                        placeholder="住所を入力するとGoogleマップリンクが表示されます"
                        {...register('defaultAddress')}
                    />
                </div>
            )}

            {/* 日付 */}
            <div className="space-y-1.5">
                <Label htmlFor="date">日付</Label>
                <Input
                    id="date"
                    type="date"
                    min={allowPastDate ? undefined : today}
                    {...register('date')}
                />
                {errors.date && (
                    <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
            </div>

            {/* 開始時刻・終了時刻 (15分刻み) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>開始時刻</Label>
                    <Controller
                        name="defaultStartTime"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={(val) => {
                                    field.onChange(val)
                                    // 開始時刻変更時に終了時刻を +60min に自動セット
                                    setValue('defaultEndTime', addMinutesToTime(val, 60))
                                }}
                            >
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
                        )}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>終了時刻</Label>
                    <Controller
                        name="defaultEndTime"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
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
                        )}
                    />
                    {errors.defaultEndTime && (
                        <p className="text-sm text-destructive">{errors.defaultEndTime.message}</p>
                    )}
                </div>
            </div>

            {/* 幹事 */}
            <div className="space-y-1.5">
                <Label>幹事</Label>
                <div className="relative">
                    <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                        {organizerUserId ? (
                            selectedMember ? (
                                <span className="text-sm font-medium">{selectedMember.displayName ?? selectedMember.userId}</span>
                            ) : (
                                <span className="text-sm font-medium text-gray-500">{organizerUserId}</span>
                            )
                        ) : (
                            <span className="text-sm text-gray-400">未定</span>
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
                    {showOrganizerDropdown && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                            {/* 未定オプション */}
                            <button
                                type="button"
                                onClick={() => {
                                    setValue('organizerUserId', '')
                                    setOrganizerSearch('')
                                    setShowOrganizerDropdown(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left"
                            >
                                <div className="w-6 h-6 bg-gray-100 rounded-full shrink-0 flex items-center justify-center text-xs text-gray-400">?</div>
                                <span className="text-gray-500">未定</span>
                            </button>
                            {filteredMembers.map((m: Member) => (
                                <button
                                    key={m.userId}
                                    type="button"
                                    onClick={() => {
                                        setValue('organizerUserId', m.userId)
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
                <Controller
                    name="repeat"
                    control={control}
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
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
                    )}
                />
            </div>

            {/* 公開設定 */}
            <div className="space-y-1.5">
                <Label>公開設定</Label>
                <Controller
                    name="visibility"
                    control={control}
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
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
                    )}
                />
            </div>

            {/* 参加費 */}
            <div className="space-y-1.5">
                <Label htmlFor="participationFee">参加費（円）</Label>
                <Input
                    id="participationFee"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0（無料の場合は空欄）"
                    {...register('participationFee')}
                />
            </div>

            {/* 定員 */}
            <div className="space-y-1.5">
                <Label>定員</Label>
                <Controller
                    name="hasCapacity"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.target.checked)
                                        if (!e.target.checked) setValue('capacity', '')
                                    }}
                                    className="accent-blue-600"
                                />
                                定員を設定する
                            </label>
                        </div>
                    )}
                />
                {watch('hasCapacity') && (
                    <div className="space-y-2">
                        {(isCustomCapacity || resolvedIsCustom) ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="人数を入力"
                                    className="w-40"
                                    {...register('capacity')}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomCapacity(false)
                                        setValue('capacity', '')
                                    }}
                                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                >
                                    リストから選択
                                </button>
                            </div>
                        ) : (
                            <Controller
                                name="capacity"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={field.value}
                                            onValueChange={(val) => {
                                                if (val === '__custom__') {
                                                    setIsCustomCapacity(true)
                                                    field.onChange('')
                                                } else {
                                                    field.onChange(val)
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="人数を選択" />
                                            </SelectTrigger>
                                            <SelectContent side="bottom" sideOffset={4}>
                                                {capacityOptions.map((n) => (
                                                    <SelectItem key={n} value={String(n)}>
                                                        {n}人
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="__custom__">
                                                    その他（手入力）
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* 説明 */}
            <div className="space-y-1.5">
                <Label htmlFor="description">説明</Label>
                <textarea
                    id="description"
                    placeholder="説明を入力"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('description')}
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
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? '処理中...' : submitLabel}
                </Button>
            </div>
        </form>
    )
}
