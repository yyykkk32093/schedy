import { useHomeFeed } from '@/features/home/hooks/useHomeFeed'
import { Separator } from '@/shared/components/ui/separator'
import { Bookmark, Loader2, Megaphone } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FeedCard } from './FeedCard'

const SCROLL_KEY = 'home-feed-scroll-y'

export function FeedList() {
    const [bookmarkOnly, setBookmarkOnly] = useState(false)

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useHomeFeed()

    const observerRef = useRef<HTMLDivElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const restoredRef = useRef(false)

    // 無限スクロール: IntersectionObserver
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage],
    )

    useEffect(() => {
        const el = observerRef.current
        if (!el) return

        const observer = new IntersectionObserver(handleObserver, {
            rootMargin: '200px',
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [handleObserver])

    // スクロール位置の保存
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // スクロール位置の復元（データ読み込み完了後に一度だけ）
    const allItems = data?.pages.flatMap((p) => p.items) ?? []
    const displayItems = bookmarkOnly ? allItems.filter((item) => item.isBookmarked) : allItems
    useEffect(() => {
        if (restoredRef.current || allItems.length === 0) return
        const saved = sessionStorage.getItem(SCROLL_KEY)
        if (saved) {
            requestAnimationFrame(() => {
                window.scrollTo(0, Number(saved))
            })
        }
        restoredRef.current = true
    }, [allItems.length])

    // ── ローディング ──
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    // ── エラー ──
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-sm">フィードの読み込みに失敗しました</p>
            </div>
        )
    }

    // ── 空 ──
    if (allItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Megaphone className="mb-3 h-12 w-12" />
                <h2 className="text-lg font-semibold text-gray-600">お知らせはまだありません</h2>
                <p className="mt-1 text-sm">
                    コミュニティに参加するとお知らせが表示されます
                </p>
            </div>
        )
    }

    return (
        <div>
            {/* ブックマークフィルタ */}
            <div className="flex items-center gap-2 px-4 py-2">
                <button
                    type="button"
                    onClick={() => setBookmarkOnly(!bookmarkOnly)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${bookmarkOnly
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                >
                    <Bookmark className={`h-3.5 w-3.5 ${bookmarkOnly ? 'fill-yellow-500' : ''}`} />
                    お気に入り
                </button>
            </div>

            {displayItems.length === 0 && bookmarkOnly ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bookmark className="mb-3 h-10 w-10" />
                    <p className="text-sm">ブックマークしたお知らせはありません</p>
                </div>
            ) : (
                displayItems.map((item, idx) => (
                    <div key={item.id}>
                        {idx > 0 && <Separator />}
                        <FeedCard item={item} />
                    </div>
                ))
            )}

            {/* 無限スクロールのセンチネル */}
            <div ref={observerRef} className="h-4" />

            {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}
        </div>
    )
}
