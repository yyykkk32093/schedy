/**
 * LocationSettings — コミュニティ活動拠点の管理コンポーネント
 *
 * MAIN（1件まで）と SUB（複数可）の拠点を編集可能。
 * 保存は親コンポーネントが一括で行うため、変更を onLocationsChange で通知する。
 */
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
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface LocationEntry {
    type: 'MAIN' | 'SUB'
    area: string
    station: string
}

interface LocationSettingsProps {
    communityId: string
    initialLocations?: Array<{
        id: string
        type: 'MAIN' | 'SUB'
        area: string
        station: string | null
        sortOrder: number
    }>
    /** 変更時に親へ通知（一括保存用） */
    onLocationsChange: (locations: LocationEntry[]) => void
}

export function LocationSettings({ communityId: _communityId, initialLocations, onLocationsChange }: LocationSettingsProps) {
    const [locations, setLocations] = useState<LocationEntry[]>([])

    useEffect(() => {
        if (initialLocations && initialLocations.length > 0) {
            const sorted = initialLocations
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((l) => ({ type: l.type, area: l.area, station: l.station ?? '' }))
            setLocations(sorted)
        }
    }, [initialLocations])

    const updateAndNotify = (newLocations: LocationEntry[]) => {
        setLocations(newLocations)
        onLocationsChange(newLocations)
    }

    const addLocation = () => {
        const hasMain = locations.some((l) => l.type === 'MAIN')
        updateAndNotify([...locations, { type: hasMain ? 'SUB' : 'MAIN', area: '', station: '' }])
    }

    const removeLocation = (index: number) => {
        updateAndNotify(locations.filter((_, i) => i !== index))
    }

    const updateField = (index: number, field: keyof LocationEntry, value: string) => {
        // type を MAIN → SUB に変更しようとした場合、他にメインがなければ拒否
        if (field === 'type' && locations[index].type === 'MAIN' && value === 'SUB') {
            const otherMains = locations.filter((l, i) => i !== index && l.type === 'MAIN')
            if (otherMains.length === 0) {
                // メインが自分だけ → サブに変更不可
                return
            }
        }
        const updated = locations.map((loc, i) =>
            i === index ? { ...loc, [field]: value } : loc,
        )
        updateAndNotify(updated)
    }

    const hasMain = locations.some((l) => l.type === 'MAIN')
    const mainHasArea = locations.some((l) => l.type === 'MAIN' && l.area.trim() !== '')
    /** メインが未設定（エリア名空）のときサブは追加不可 */
    const canAddSub = hasMain && mainHasArea
    /** 拠点は最大3件まで */
    const canAdd = locations.length < 3

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    活動拠点
                </Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLocation}
                    disabled={!canAdd}
                    className="h-7 text-xs"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    追加
                </Button>
            </div>

            {locations.length === 0 && (
                <p className="text-xs text-gray-400">活動拠点が登録されていません</p>
            )}

            {locations.map((loc, index) => {
                // サブ拠点はメインが設定済みでないと入力不可
                const isSubDisabled = loc.type === 'SUB' && !canAddSub
                // 唯一のメインはサブに変更不可
                const isOnlyMain = loc.type === 'MAIN' && locations.filter((l) => l.type === 'MAIN').length === 1
                    && locations.some((l) => l.type === 'SUB')
                // サブが存在する唯一のメインは削除不可
                const cannotDelete = isOnlyMain

                return (
                    <div key={index} className={`flex items-start gap-2 p-2 rounded-md ${isSubDisabled ? 'bg-gray-100 opacity-60' : 'bg-gray-50'}`}>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex gap-2">
                                <Select
                                    value={loc.type}
                                    onValueChange={(v) => updateField(index, 'type', v)}
                                >
                                    <SelectTrigger className="w-24 h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MAIN" disabled={hasMain && loc.type !== 'MAIN'}>
                                            メイン
                                        </SelectItem>
                                        <SelectItem value="SUB" disabled={isOnlyMain}>サブ</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    value={loc.area}
                                    onChange={(e) => updateField(index, 'area', e.target.value)}
                                    placeholder="活動エリア名（例: 渋谷区、新宿区）"
                                    className="h-8 text-sm flex-1"
                                    disabled={isSubDisabled}
                                />
                            </div>
                            <Input
                                value={loc.station}
                                onChange={(e) => updateField(index, 'station', e.target.value)}
                                placeholder="最寄り駅名（例: 渋谷駅、新宿御苑前駅）"
                                className="h-8 text-sm"
                                disabled={isSubDisabled}
                            />
                            {isSubDisabled && (
                                <p className="text-[10px] text-amber-600">メインの活動エリアを先に入力してください</p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            onClick={() => removeLocation(index)}
                            disabled={cannotDelete}
                            title={cannotDelete ? 'サブ拠点を先に削除してください' : undefined}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )
            })}
        </div>
    )
}
