import { FeedList } from '@/features/home/components/FeedList'
import { SearchBar } from '@/features/home/components/SearchBar'
import { useState } from 'react'

/**
 * HomePage — ホーム画面
 * 所属コミュニティのアナウンスメントをSNSフィード風に一覧表示
 */
export function HomePage() {
    const [isSearching, setIsSearching] = useState(false)

    return (
        <div className="pb-4">
            <SearchBar onSearchActiveChange={setIsSearching} />
            {!isSearching && <FeedList />}
        </div>
    )
}
