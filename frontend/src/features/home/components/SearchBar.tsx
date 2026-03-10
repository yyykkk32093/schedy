import { useSearchAnnouncements } from '@/features/announcement/hooks/useAnnouncementSocialQueries'
import { Separator } from '@/shared/components/ui/separator'
import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FeedCard } from './FeedCard'

/**
 * SearchBar — お知らせ検索バー（UBL-4）
 * デバウンス付き入力で検索結果をインラインに表示
 */
export function SearchBar() {
    const [input, setInput] = useState('')
    const [debouncedKeyword, setDebouncedKeyword] = useState('')

    // 300ms デバウンス
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(input.trim()), 300)
        return () => clearTimeout(timer)
    }, [input])

    const { data, isLoading, isFetching } = useSearchAnnouncements(debouncedKeyword)

    const showResults = debouncedKeyword.length >= 2
    const items = data?.items ?? []

    return (
        <div className="px-4 pt-3 pb-1">
            {/* 入力フィールド */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="お知らせを検索…"
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
                {input && (
                    <button
                        type="button"
                        onClick={() => { setInput(''); setDebouncedKeyword('') }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* 検索結果 */}
            {showResults && (
                <div className="mt-2">
                    {(isLoading || isFetching) && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    )}

                    {!isLoading && items.length === 0 && (
                        <p className="py-4 text-center text-sm text-gray-400">
                            「{debouncedKeyword}」に一致するお知らせはありません
                        </p>
                    )}

                    {items.length > 0 && (
                        <div className="rounded-lg border bg-white">
                            {items.map((item, idx) => (
                                <div key={item.id}>
                                    {idx > 0 && <Separator />}
                                    <FeedCard item={item} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
