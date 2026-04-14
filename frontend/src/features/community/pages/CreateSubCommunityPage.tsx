import {
    type CommunitySettingsData,
    defaultSettingsData,
    SettingsStep2,
    SettingsStep3,
} from '@/features/community/components/CommunitySettingsForm'
import { useCommunity, useCreateSubCommunity, useMembers } from '@/features/community/hooks/useCommunityQueries'
import { CharacterCounter } from '@/shared/components/ui/CharacterCounter'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { CreateSubCommunityRequest, Member } from '@/shared/types/api'
import { ArrowLeft, Check, Copy, Search, Settings } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

type MemberInheritance = 'ALL' | 'SELECT' | 'OWNER_ONLY' | 'ADMIN_AND_ABOVE'

const MEMBER_INHERITANCE_OPTIONS: { value: MemberInheritance; label: string; desc: string }[] = [
    { value: 'ADMIN_AND_ABOVE', label: '管理者以上', desc: 'OWNER・ADMIN のみ引き継ぎ' },
    { value: 'ALL', label: '全メンバー', desc: '全てのメンバーを引き継ぎ' },
    { value: 'SELECT', label: '選択して引き継ぎ', desc: 'メンバーを選択' },
    { value: 'OWNER_ONLY', label: 'オーナーのみ', desc: 'オーナーだけで開始' },
]

/**
 * CreateSubCommunityPage — サブコミュニティ作成ウィザード
 *
 * Step 1: 基本情報 + 設定引き継ぎ選択 + メンバー引き継ぎ選択
 * Step 2: 参加・活動設定（入力し直す場合のみ）
 * Step 3: カテゴリ・タグ（入力し直す場合のみ）
 */
export function CreateSubCommunityPage() {
    const { id: parentId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: parentCommunity } = useCommunity(parentId!)
    const { data: membersData } = useMembers(parentId!)
    const createMutation = useCreateSubCommunity(parentId!)

    // ---- Form state ----
    const [step, setStep] = useState(1)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [inheritSettings, setInheritSettings] = useState(true)
    const [memberInheritance, setMemberInheritance] = useState<MemberInheritance>('ADMIN_AND_ABOVE')
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
    const [showMemberDialog, setShowMemberDialog] = useState(false)

    // Settings form (for "入力し直す" mode)
    const [settings, setSettings] = useState<CommunitySettingsData>({ ...defaultSettingsData })
    const updateSettings = useCallback((patch: Partial<CommunitySettingsData>) => {
        setSettings((prev) => ({ ...prev, ...patch }))
    }, [])

    const totalSteps = inheritSettings ? 1 : 3
    const canProceed = step === 1 ? name.trim().length > 0 : true

    const handleSubmit = async () => {
        try {
            const payload: CreateSubCommunityRequest = {
                name: name.trim(),
                description: description.trim() || undefined,
                inheritSettings,
                memberInheritance,
                selectedMemberIds: memberInheritance === 'SELECT' ? selectedMemberIds : undefined,
            }

            if (!inheritSettings) {
                const s = settings
                Object.assign(payload, {
                    joinMethod: s.joinMethod,
                    isPublic: s.isPublic,
                    maxMembers: s.maxMembers ? Number(s.maxMembers) : undefined,
                    activityFrequency: s.freqUnit && s.freqCount ? `${s.freqUnit}${s.freqCount}回` : undefined,
                    targetGender: s.targetGender.length > 0 ? s.targetGender : undefined,
                    ageMin: s.ageMin ? Number(s.ageMin) : undefined,
                    ageMax: s.ageMax ? Number(s.ageMax) : undefined,
                    categoryIds: s.selectedCategoryId ? [s.selectedCategoryId] : undefined,
                    recommendedLevelMin: s.recommendedLevelEnabled ? s.recommendedLevelRange[0] : undefined,
                    recommendedLevelMax: s.recommendedLevelEnabled ? s.recommendedLevelRange[1] : undefined,
                    activityDays: s.selectedDays.length > 0 ? s.selectedDays : undefined,
                    tags: s.tags.length > 0 ? s.tags : undefined,
                })
            }

            await createMutation.mutateAsync(payload)
            toast.success('サブコミュニティを作成しました')
            navigate(`/communities/${parentId}`)
        } catch {
            toast.error('作成に失敗しました')
        }
    }

    // ---- Step labels for indicator ----
    const stepLabels = inheritSettings
        ? ['基本設定']
        : ['基本設定', '参加・活動', 'カテゴリ・タグ']

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            <button
                onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
                <ArrowLeft size={16} /> {step > 1 ? '前のステップ' : '戻る'}
            </button>

            <h1 className="text-lg font-bold text-gray-900">サブコミュニティを作成</h1>

            {/* ステップインジケーター */}
            <StepIndicator step={step} labels={stepLabels} />

            {/* Step 1: 基本情報 */}
            {step === 1 && (
                <Card className="p-4 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="sub-name">コミュニティ名 *</Label>
                        <Input
                            id="sub-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例: 初心者クラス"
                            maxLength={100}
                            autoFocus
                        />
                        <CharacterCounter current={name.length} max={100} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sub-desc">説明</Label>
                        <textarea
                            id="sub-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="サブコミュニティの説明（任意）"
                            rows={3}
                            maxLength={2000}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <CharacterCounter current={description.length} max={2000} />
                    </div>

                    {/* 設定引き継ぎ */}
                    <div className="space-y-2">
                        <Label>設定の引き継ぎ</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={inheritSettings ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInheritSettings(true)}
                                className="flex items-center gap-1.5"
                            >
                                <Copy size={14} />
                                親の設定を全て引き継ぐ
                            </Button>
                            <Button
                                type="button"
                                variant={!inheritSettings ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInheritSettings(false)}
                                className="flex items-center gap-1.5"
                            >
                                <Settings size={14} />
                                入力し直す
                            </Button>
                        </div>
                        {inheritSettings && parentCommunity && (
                            <p className="text-xs text-gray-500 mt-1">
                                {parentCommunity.name} の公開設定・参加方式・カテゴリ・レベル・曜日・性別等を全てコピーします
                            </p>
                        )}
                    </div>

                    {/* メンバー引き継ぎ */}
                    <div className="space-y-2">
                        <Label>メンバーの引き継ぎ</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {MEMBER_INHERITANCE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setMemberInheritance(opt.value)
                                        if (opt.value === 'SELECT') setShowMemberDialog(true)
                                    }}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${memberInheritance === opt.value
                                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{opt.label}</span>
                                    <span className="text-xs text-gray-500">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                        {memberInheritance === 'SELECT' && selectedMemberIds.length > 0 && (
                            <p className="text-xs text-blue-600">{selectedMemberIds.length}人を選択中</p>
                        )}
                        {memberInheritance === 'SELECT' && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowMemberDialog(true)}>
                                メンバーを選択...
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Step 2: 参加・活動設定（入力し直す場合のみ） */}
            {step === 2 && !inheritSettings && (
                <Card className="p-4">
                    <SettingsStep2 data={settings} update={updateSettings} />
                </Card>
            )}

            {/* Step 3: カテゴリ・タグ（入力し直す場合のみ） */}
            {step === 3 && !inheritSettings && (
                <Card className="p-4">
                    <SettingsStep3 data={settings} update={updateSettings} basicInfo={{ name, description }} />
                </Card>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex gap-3 pt-4 border-t">
                {step > 1 && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
                        戻る
                    </Button>
                )}
                {step < totalSteps ? (
                    <Button type="button" className="flex-1" disabled={!canProceed} onClick={() => setStep(step + 1)}>
                        次へ
                    </Button>
                ) : (
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={!name.trim() || createMutation.isPending}
                        onClick={handleSubmit}
                    >
                        {createMutation.isPending ? '作成中...' : 'サブコミュニティを作成'}
                    </Button>
                )}
            </div>

            {/* メンバー選択ダイアログ */}
            <MemberSelectDialog
                open={showMemberDialog}
                onOpenChange={setShowMemberDialog}
                members={membersData?.members ?? []}
                selectedIds={selectedMemberIds}
                onSelectionChange={setSelectedMemberIds}
            />
        </div>
    )
}

// ── ステップインジケーター ──

function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-2">
            {labels.map((label, i) => {
                const s = i + 1
                const isActive = s === step
                const isDone = s < step
                return (
                    <div key={s} className="flex items-center gap-1">
                        {i > 0 && <div className={`w-8 h-0.5 ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                        <div
                            className={`flex items-center gap-1 text-xs font-medium ${isActive ? 'text-blue-600' : isDone ? 'text-blue-500' : 'text-gray-400'}`}
                        >
                            <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            >
                                {isDone ? '✓' : s}
                            </span>
                            <span className="hidden sm:inline">{label}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ── メンバー選択ダイアログ ──

interface MemberSelectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: Member[]
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
}

function MemberSelectDialog({ open, onOpenChange, members, selectedIds, onSelectionChange }: MemberSelectDialogProps) {
    const [filter, setFilter] = useState('')

    // OWNER は常に含まれるので選択対象外
    const selectableMembers = useMemo(() => members.filter((m) => m.role !== 'OWNER'), [members])

    const filteredMembers = useMemo(
        () =>
            selectableMembers.filter((m) => {
                const displayName = m.displayName ?? m.userId
                return displayName.toLowerCase().includes(filter.toLowerCase())
            }),
        [selectableMembers, filter],
    )

    const allSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.includes(m.userId))

    const toggleAll = () => {
        if (allSelected) {
            const filteredIds = new Set(filteredMembers.map((m) => m.userId))
            onSelectionChange(selectedIds.filter((id) => !filteredIds.has(id)))
        } else {
            const newIds = new Set([...selectedIds, ...filteredMembers.map((m) => m.userId)])
            onSelectionChange(Array.from(newIds))
        }
    }

    const toggleMember = (userId: string) => {
        if (selectedIds.includes(userId)) {
            onSelectionChange(selectedIds.filter((id) => id !== userId))
        } else {
            onSelectionChange([...selectedIds, userId])
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>引き継ぐメンバーを選択</DialogTitle>
                </DialogHeader>

                {/* 検索 */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="メンバー名で検索" className="pl-9" />
                </div>

                {/* 全選択 */}
                <button type="button" onClick={toggleAll} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 py-1">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${allSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                        {allSelected && '✓'}
                    </span>
                    <span>全て選択 ({filteredMembers.length}人)</span>
                </button>

                {/* メンバーリスト */}
                <div className="flex-1 overflow-y-auto space-y-1 max-h-60">
                    {/* OWNER (常に含まれる) */}
                    {members
                        .filter((m) => m.role === 'OWNER')
                        .map((m) => (
                            <div key={m.userId} className="flex items-center gap-3 px-2 py-2 bg-amber-50 rounded-lg">
                                <div
                                    className="w-7 h-7 rounded-full bg-gray-200 shrink-0 bg-cover bg-center"
                                    style={m.avatarUrl ? { backgroundImage: `url(${m.avatarUrl})` } : {}}
                                />
                                <span className="text-sm flex-1 truncate">{m.displayName ?? m.userId.slice(0, 8)}</span>
                                <span className="text-xs text-amber-600 font-medium">OWNER（必須）</span>
                                <Check size={14} className="text-amber-600" />
                            </div>
                        ))}

                    {filteredMembers.map((m) => (
                        <button
                            key={m.userId}
                            type="button"
                            onClick={() => toggleMember(m.userId)}
                            className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg text-left transition-colors ${selectedIds.includes(m.userId) ? 'bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                        >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${selectedIds.includes(m.userId) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                {selectedIds.includes(m.userId) && '✓'}
                            </span>
                            <div
                                className="w-7 h-7 rounded-full bg-gray-200 shrink-0 bg-cover bg-center"
                                style={m.avatarUrl ? { backgroundImage: `url(${m.avatarUrl})` } : {}}
                            />
                            <span className="text-sm flex-1 truncate">{m.displayName ?? m.userId.slice(0, 8)}</span>
                            <span className="text-xs text-gray-400">{m.role}</span>
                        </button>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        キャンセル
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>{selectedIds.length}人を選択</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
