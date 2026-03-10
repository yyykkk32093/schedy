import { FeedList } from '@/features/home/components/FeedList'
import { SearchBar } from '@/features/home/components/SearchBar'

/**
 * HomePage — ホーム画面
 * 所属コミュニティのアナウンスメントをSNSフィード風に一覧表示
 */
export function HomePage() {
    return (
        <div className="pb-4">
            <SearchBar />
            <FeedList />
        </div>
    )
}
