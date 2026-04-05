import { Badge } from '@/shared/components/ui/badge'
import type { CommunityDetail } from '@/shared/types/api'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Clock, Gauge, MapPin, Train } from 'lucide-react'
import { useState } from 'react'

interface MetaSectionProps {
    community: CommunityDetail
}

/** 場所ピル（展開UIで使用） */
interface LocationPill {
    id: string
    type: 'MAIN' | 'SUB'
    area: string
    station: string | null
}

/**
 * MetaSection — 活動場所（楕円バッジ重ね）+ 開催頻度 + 活動日 + レベル
 *
 * メンバー数・公開/非公開・カテゴリは HeroSection に移動済み。
 * タグは TagSection が担当。
 */
export function MetaSection({ community }: MetaSectionProps) {
    const locationPills = buildLocationPills(community)
    const hasFrequency = !!community.activityFrequency
    const hasActivityDays = community.activityDays.length > 0
    const hasLevels = community.participationLevels.length > 0

    if (locationPills.length === 0 && !hasFrequency && !hasActivityDays && !hasLevels) return null

    return (
        <div className="flex flex-wrap items-start gap-2">
            {/* 活動場所 — 楕円バッジ重ね表示 */}
            {locationPills.length > 0 && (
                <LocationPillStack pills={locationPills} />
            )}

            {/* 開催頻度 */}
            {hasFrequency && (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {community.activityFrequency}
                </Badge>
            )}

            {/* 活動日（アイコン + バッジ） */}
            {hasActivityDays && (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {community.activityDays.map(dayLabel).join('・')}
                </Badge>
            )}

            {/* レベル（アイコン + バッジ） */}
            {hasLevels && community.participationLevels.map((level) => (
                <Badge key={level.id} variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                    <Gauge className="w-3 h-3" />
                    {level.name}
                </Badge>
            ))}
        </div>
    )
}

function dayLabel(day: string): string {
    const map: Record<string, string> = {
        MON: '月', TUE: '火', WED: '水', THU: '木',
        FRI: '金', SAT: '土', SUN: '日',
    }
    return map[day] ?? day
}

/**
 * LocationPillStack — 楕円バッジの重ね → タップ展開UI
 *
 * 折りたたみ時: メインの楕円バッジが最前面、サブが少しずつ右下にずれて重なる + "+N" バッジ
 * 展開時: 全楕円バッジを縦に展開（Framer Motion アニメーション）
 */
function LocationPillStack({ pills }: { pills: LocationPill[] }) {
    const [expanded, setExpanded] = useState(false)
    const mainPill = pills[0]
    const subPills = pills.slice(1)
    const hasMultiple = subPills.length > 0

    /** 1つの楕円バッジを描画 */
    const renderPill = (pill: LocationPill, showLabel = false) => (
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs whitespace-nowrap">
            {showLabel && pill.type === 'MAIN' && (
                <span className="text-[10px] font-semibold text-blue-600 mr-0.5">MAIN</span>
            )}
            {showLabel && pill.type === 'SUB' && (
                <span className="text-[10px] font-semibold text-gray-400 mr-0.5">SUB</span>
            )}
            <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
            <span className="text-gray-700">{pill.area}</span>
            {pill.station && (
                <>
                    <Train className="w-3 h-3 text-gray-400 shrink-0 ml-0.5" />
                    <span className="text-gray-500">{pill.station}</span>
                </>
            )}
        </span>
    )

    /* 単一拠点 — シンプル表示 */
    if (!hasMultiple) {
        return renderPill(mainPill)
    }

    return (
        <div
            className="cursor-pointer select-none"
            onClick={() => setExpanded((prev) => !prev)}
        >
            <AnimatePresence mode="wait" initial={false}>
                {!expanded ? (
                    /* ── 折りたたみ: 楕円バッジ重ね ── */
                    <motion.div
                        key="collapsed"
                        className="relative inline-flex items-center"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* 背面のサブバッジ（ずらし重ね） */}
                        {subPills.map((sub, i) => (
                            <span
                                key={sub.id}
                                className="absolute rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs whitespace-nowrap"
                                style={{
                                    left: `${(i + 1) * 8}px`,
                                    top: `${(i + 1) * 3}px`,
                                    zIndex: -i - 1,
                                    opacity: Math.max(0.3, 1 - (i + 1) * 0.25),
                                }}
                            >
                                {/* 中身は見えないので空文字でサイズ合わせ */}
                                <span className="invisible inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{sub.area}
                                </span>
                            </span>
                        ))}

                        {/* メインバッジ（最前面） */}
                        <span className="relative z-10">
                            {renderPill(mainPill)}
                        </span>

                        {/* +N バッジ */}
                        <Badge variant="secondary" className="text-xs ml-1.5 shrink-0 relative z-10">
                            +{subPills.length}
                        </Badge>
                    </motion.div>
                ) : (
                    /* ── 展開: 全バッジを縦スタック ── */
                    <motion.div
                        key="expanded"
                        className="flex flex-col gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {pills.map((pill, i) => (
                            <motion.div
                                key={pill.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.15 }}
                            >
                                {renderPill(pill, true)}
                            </motion.div>
                        ))}
                        <span className="text-[10px] text-gray-400 pl-1">
                            タップで折りたたむ
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 折りたたみ時の下マージン（重なり分） */}
            {!expanded && hasMultiple && (
                <div style={{ height: subPills.length * 3 }} />
            )}
        </div>
    )
}

/**
 * コミュニティデータから場所ピルを構築
 */
function buildLocationPills(community: CommunityDetail): LocationPill[] {
    const pills: LocationPill[] = []
    const locations = community.locations ?? []
    const mainLocation = locations.find((l) => l.type === 'MAIN')
    const subLocations = locations
        .filter((l) => l.type === 'SUB')
        .sort((a, b) => a.sortOrder - b.sortOrder)

    if (mainLocation) {
        pills.push({
            id: mainLocation.id,
            type: 'MAIN',
            area: mainLocation.area,
            station: mainLocation.station,
        })
        for (const sub of subLocations) {
            pills.push({
                id: sub.id,
                type: 'SUB',
                area: sub.area,
                station: sub.station,
            })
        }
    }

    return pills
}
