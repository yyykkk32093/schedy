import { useSubCommunities } from '@/features/community/hooks/useCommunityQueries'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/shared/components/ui/carousel'
import { MoreHorizontal, Network, Plus, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SubCommunityCarouselProps {
    communityId: string
    isAdminOrAbove: boolean
    /** null = 親コミュニティ、string = サブコミュニティ */
    parentId: string | null
}

/**
 * SubCommunityCarousel — カバー画像右端に配置するサブコミュニティカルーセル
 *
 * 親コミュニティ側:
 * - 1枚ずつプロフィール画像を表示（循環ループ）
 * - 下部にドットインジケーター
 * - 右上に ... メニュー（新規作成/ツリー）
 *
 * サブコミュニティ側:
 * - サブコミュニティ作成動線は閉じる（新規作成ボタン非表示）
 * - ツリー表示のみ維持（親コミュニティへの導線）
 */
export function SubCommunityCarousel({ communityId, isAdminOrAbove, parentId }: SubCommunityCarouselProps) {
    const navigate = useNavigate()
    const isSubCommunity = parentId !== null

    // サブコミュニティの場合は自身の子を取得する必要なし（作成動線を閉じているため）
    const { data, isLoading } = useSubCommunities(communityId)
    const children = isSubCommunity ? [] : (data?.children ?? [])
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Embla API for dot indicator
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!api) return
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())
        const onSelect = () => setCurrent(api.selectedScrollSnap())
        api.on('select', onSelect)
        return () => { api.off('select', onSelect) }
    }, [api])

    const handleNavigateToChild = useCallback(
        (childId: string) => navigate(`/communities/${childId}`),
        [navigate],
    )

    if (isLoading) return null

    // ── サブコミュニティ側: ツリー表示ボタンのみ ──
    if (isSubCommunity) {
        return (
            <button
                onClick={() => navigate(`/communities/${communityId}/sub/tree`)}
                className="flex flex-col items-center justify-center w-[5rem] h-14 rounded-lg bg-black/30 backdrop-blur-sm text-white/90 hover:bg-black/40 transition-colors shrink-0"
                title="コミュニティツリー"
            >
                <Network size={16} />
                <span className="text-[8px] mt-0.5 leading-tight whitespace-nowrap">コミュニティツリー</span>
            </button>
        )
    }

    // ── 親コミュニティ側: 子なし & 非管理者 → 非表示 ──
    if (children.length === 0 && !isAdminOrAbove) return null

    // ── 親コミュニティ側: 子なし & 管理者 → 小さな + ボタン + ラベル ──
    if (children.length === 0) {
        return (
            <div className="flex flex-col items-center gap-0.5 w-[5rem] shrink-0">
                <span className="text-[8px] text-white/80 drop-shadow-sm font-medium whitespace-nowrap">サブコミュニティ作成</span>
                <button
                    onClick={() => navigate(`/communities/${communityId}/sub/new`)}
                    className="flex items-center justify-center w-14 h-9 rounded-lg border-2 border-dashed border-white/50 text-white/70 hover:border-white/80 hover:text-white transition-colors"
                    title="サブコミュニティを作成"
                >
                    <Plus size={16} />
                </button>
            </div>
        )
    }

    // ── 親コミュニティ側: カルーセル表示 ──
    return (
        <div className="relative w-[5rem] shrink-0">
            {/* ラベル */}
            <p className="text-[8px] text-white/80 drop-shadow-sm font-medium text-center mb-0.5 whitespace-nowrap">サブコミュニティ</p>

            {/* ... メニュー（右上） */}
            {isAdminOrAbove && (
                <div className="absolute top-3 -right-1 z-10" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((p) => !p)}
                        className="p-0.5 rounded-full bg-black/30 hover:bg-black/50 shadow-sm"
                    >
                        <MoreHorizontal size={12} className="text-white" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-5 z-50 w-36 bg-white rounded-lg shadow-lg border py-1 text-xs">
                                <button
                                    onClick={() => { setMenuOpen(false); navigate(`/communities/${communityId}/sub/new`) }}
                                    className="flex items-center gap-1.5 w-full px-3 py-1.5 hover:bg-gray-50 text-left"
                                >
                                    <Plus size={12} /> 新規作成
                                </button>
                                <button
                                    onClick={() => { setMenuOpen(false); navigate(`/communities/${communityId}/sub/tree`) }}
                                    className="flex items-center gap-1.5 w-full px-3 py-1.5 hover:bg-gray-50 text-left"
                                >
                                    <Network size={12} /> ツリー表示
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* カルーセル本体 */}
            <Carousel
                opts={{ loop: true, align: 'center' }}
                setApi={setApi}
                className="w-full"
            >
                <CarouselContent className="-ml-0">
                    {children.map((child) => (
                        <CarouselItem key={child.id} className="pl-0 basis-full">
                            <button
                                onClick={() => handleNavigateToChild(child.id)}
                                className="w-full flex flex-col items-center gap-0.5"
                            >
                                {/* プロフィール画像（横長） */}
                                <div className="w-14 h-9 rounded-lg bg-gray-100 overflow-hidden shadow-sm">
                                    {child.logoUrl ? (
                                        <img
                                            src={child.logoUrl}
                                            alt={child.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Users size={16} />
                                        </div>
                                    )}
                                </div>
                                {/* 名前 */}
                                <span className="text-[9px] text-white/90 leading-tight text-center line-clamp-1 w-full px-0.5 drop-shadow-sm">
                                    {child.name}
                                </span>
                            </button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* ドットインジケーター */}
            {count > 1 && (
                <div className="flex items-center justify-center gap-1 mt-0.5">
                    {Array.from({ length: count }).map((_, i) => (
                        <span
                            key={i}
                            className={`block rounded-full transition-all ${i === current
                                ? 'w-1.5 h-1.5 bg-white'
                                : 'w-1 h-1 bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
