import { useCommunityMasters, useCreateCommunity } from '@/features/community/hooks/useCommunityQueries'
import { Badge } from '@/shared/components/ui/badge'
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
import type { CreateCommunityRequest } from '@/shared/types/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const JOIN_METHOD_OPTIONS = [
    { value: 'FREE_JOIN', label: '自由参加' },
    { value: 'APPROVAL', label: '承認制' },
    { value: 'INVITATION', label: '招待制' },
] as const

const DAY_OPTIONS = [
    { value: 'MON', label: '月' },
    { value: 'TUE', label: '火' },
    { value: 'WED', label: '水' },
    { value: 'THU', label: '木' },
    { value: 'FRI', label: '金' },
    { value: 'SAT', label: '土' },
    { value: 'SUN', label: '日' },
] as const

const GENDER_OPTIONS = [
    { value: 'MIXED', label: '男女混合' },
    { value: 'MALE', label: '男性のみ' },
    { value: 'FEMALE', label: '女性のみ' },
] as const

/**
 * CommunityCreatePage — コミュニティ作成フォーム（フル実装）
 */
export function CommunityCreatePage() {
    const navigate = useNavigate()
    const createMutation = useCreateCommunity()
    const { data: masters, isLoading: mastersLoading } = useCommunityMasters()

    // ── Form state ──
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [communityTypeId, setCommunityTypeId] = useState('')
    const [joinMethod, setJoinMethod] = useState<'FREE_JOIN' | 'APPROVAL' | 'INVITATION'>('FREE_JOIN')
    const [isPublic, setIsPublic] = useState(true)
    const [maxMembers, setMaxMembers] = useState('')
    const [mainActivityArea, setMainActivityArea] = useState('')
    const [activityFrequency, setActivityFrequency] = useState('')
    const [nearestStation, setNearestStation] = useState('')
    const [targetGender, setTargetGender] = useState('')
    const [ageRange, setAgeRange] = useState('')
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
    const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([])
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])

    // isPublic=false → 強制 INVITATION（バックエンドのビジネスルールと同期）
    const handlePublicChange = (pub: boolean) => {
        setIsPublic(pub)
        if (!pub) setJoinMethod('INVITATION')
    }

    const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
        setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item])
    }

    const addTag = () => {
        const trimmed = tagInput.trim()
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed])
        }
        setTagInput('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        const payload: CreateCommunityRequest = {
            name: name.trim(),
            description: description.trim() || undefined,
            communityTypeId: communityTypeId || undefined,
            joinMethod,
            isPublic,
            maxMembers: maxMembers ? Number(maxMembers) : undefined,
            mainActivityArea: mainActivityArea.trim() || undefined,
            activityFrequency: activityFrequency.trim() || undefined,
            nearestStation: nearestStation.trim() || undefined,
            targetGender: targetGender || undefined,
            ageRange: ageRange.trim() || undefined,
            categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
            participationLevelIds: selectedLevelIds.length > 0 ? selectedLevelIds : undefined,
            activityDays: selectedDays.length > 0 ? selectedDays : undefined,
            tags: tags.length > 0 ? tags : undefined,
        }

        const result = await createMutation.mutateAsync(payload)
        navigate(`/communities/${result.communityId}`)
    }

    if (mastersLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    const communityTypes = masters?.communityTypes ?? []
    const categories = masters?.categories ?? []
    const participationLevels = masters?.participationLevels ?? []

    return (
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* ── 基本情報 ── */}
            <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-800 border-b pb-2">基本情報</h2>

                <div className="space-y-1.5">
                    <Label htmlFor="name">コミュニティ名 *</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例: 渋谷フットサルクラブ"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="description">説明</Label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="コミュニティの紹介文"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label>コミュニティタイプ</Label>
                    <Select value={communityTypeId} onValueChange={setCommunityTypeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                            {communityTypes.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            {/* ── 参加設定 ── */}
            <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-800 border-b pb-2">参加設定</h2>

                <div className="space-y-1.5">
                    <Label>公開設定</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={isPublic ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePublicChange(true)}
                        >
                            公開
                        </Button>
                        <Button
                            type="button"
                            variant={!isPublic ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePublicChange(false)}
                        >
                            非公開
                        </Button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label>参加方式</Label>
                    <Select
                        value={joinMethod}
                        onValueChange={(v) => setJoinMethod(v as typeof joinMethod)}
                        disabled={!isPublic}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {JOIN_METHOD_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!isPublic && (
                        <p className="text-xs text-gray-500">非公開コミュニティは招待制になります</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="maxMembers">最大メンバー数</Label>
                    <Input
                        id="maxMembers"
                        type="number"
                        min={1}
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(e.target.value)}
                        placeholder="制限なし"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label>対象性別</Label>
                    <Select value={targetGender} onValueChange={setTargetGender}>
                        <SelectTrigger>
                            <SelectValue placeholder="指定なし" />
                        </SelectTrigger>
                        <SelectContent>
                            {GENDER_OPTIONS.map((g) => (
                                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="ageRange">年齢層</Label>
                    <Input
                        id="ageRange"
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        placeholder="例: 20代〜30代"
                    />
                </div>
            </section>

            {/* ── 活動情報 ── */}
            <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-800 border-b pb-2">活動情報</h2>

                <div className="space-y-1.5">
                    <Label htmlFor="mainActivityArea">主な活動エリア</Label>
                    <Input
                        id="mainActivityArea"
                        value={mainActivityArea}
                        onChange={(e) => setMainActivityArea(e.target.value)}
                        placeholder="例: 渋谷区"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="nearestStation">最寄り駅</Label>
                    <Input
                        id="nearestStation"
                        value={nearestStation}
                        onChange={(e) => setNearestStation(e.target.value)}
                        placeholder="例: 渋谷駅"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="activityFrequency">活動頻度</Label>
                    <Input
                        id="activityFrequency"
                        value={activityFrequency}
                        onChange={(e) => setActivityFrequency(e.target.value)}
                        placeholder="例: 週1回"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label>活動曜日</Label>
                    <div className="flex flex-wrap gap-2">
                        {DAY_OPTIONS.map((d) => (
                            <Button
                                key={d.value}
                                type="button"
                                variant={selectedDays.includes(d.value) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleArrayItem(selectedDays, d.value, setSelectedDays)}
                            >
                                {d.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label>参加レベル</Label>
                    <div className="flex flex-wrap gap-2">
                        {participationLevels.map((level) => (
                            <Button
                                key={level.id}
                                type="button"
                                variant={selectedLevelIds.includes(level.id) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleArrayItem(selectedLevelIds, level.id, setSelectedLevelIds)}
                            >
                                {level.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── カテゴリ・タグ ── */}
            <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-800 border-b pb-2">カテゴリ・タグ</h2>

                <div className="space-y-1.5">
                    <Label>カテゴリ（複数選択可）</Label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                type="button"
                                variant={selectedCategoryIds.includes(cat.id) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleArrayItem(selectedCategoryIds, cat.id, setSelectedCategoryIds)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label>タグ</Label>
                    <div className="flex gap-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="タグを入力して追加"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addTag()
                                }
                            }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addTag}>
                            追加
                        </Button>
                    </div>
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100"
                                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                                >
                                    {tag} ✕
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Submit ── */}
            <div className="pt-4 border-t">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={!name.trim() || createMutation.isPending}
                >
                    {createMutation.isPending ? '作成中...' : 'コミュニティを作成'}
                </Button>
                {createMutation.isError && (
                    <p className="text-red-500 text-sm mt-2 text-center">
                        {(createMutation.error as Error).message}
                    </p>
                )}
            </div>
        </form>
    )
}
