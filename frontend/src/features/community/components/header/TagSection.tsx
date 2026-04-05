import type { CommunityDetail } from '@/shared/types/api'

interface TagSectionProps {
    community: CommunityDetail
}

/**
 * TagSection — タグのみ表示
 *
 * カテゴリは HeroSection、活動日・レベルは MetaSection に移動済み。
 */
export function TagSection({ community }: TagSectionProps) {
    const hasTags = community.tags.length > 0

    if (!hasTags) return null

    return (
        <div className="flex flex-wrap gap-1.5">
            {community.tags.map((tag) => (
                <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
                >
                    #{tag}
                </span>
            ))}
        </div>
    )
}
