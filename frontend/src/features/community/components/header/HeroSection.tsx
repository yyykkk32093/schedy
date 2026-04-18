import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { SingleImagePreview } from '@/shared/components/ui/ImagePreviewModal'
import type { CommunityDetail } from '@/shared/types/api'
import { getDefaultCoverUrl } from '@/shared/utils/defaultCoverImage'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface HeroSectionProps {
    community: CommunityDetail
    /** カバー画像右端に配置するオーバーレイ（カルーセル等） */
    coverOverlay?: ReactNode
}

/** 折りたたみ時に表示するタグ数 */
const TAG_COLLAPSE_LIMIT = 2

/**
 * HeroSection — カバー画像 + アバター + 名前 + インラインメタ + 説明
 *
 * 名前の横にメンバー数・公開/非公開・カテゴリ・タグを表示
 * タグが多い場合は展開式で表示
 */
export function HeroSection({ community, coverOverlay }: HeroSectionProps) {
    const initial = community.name.charAt(0)
    const [tagsExpanded, setTagsExpanded] = useState(false)
    const tags = community.tags ?? []
    const hasOverflow = tags.length > TAG_COLLAPSE_LIMIT
    const visibleTags = tagsExpanded ? tags : tags.slice(0, TAG_COLLAPSE_LIMIT)

    return (
        <div>
            {/* Cover image — タップで拡大表示 + 右端にカルーセルオーバーレイ */}
            {community.coverUrl ? (
                <div className="relative w-full h-32 bg-gray-200 overflow-hidden">
                    <SingleImagePreview src={community.coverUrl} alt="カバー画像">
                        <img
                            src={community.coverUrl}
                            alt="カバー画像"
                            className="w-full h-full object-cover"
                        />
                    </SingleImagePreview>
                    {/* 右端の半透明グラデーション + カルーセル */}
                    {coverOverlay && (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pl-2 bg-gradient-to-l from-black/30 via-black/15 to-transparent">
                            {coverOverlay}
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative w-full h-32 bg-gray-200 overflow-hidden">
                    <img
                        src={getDefaultCoverUrl(community.id)}
                        alt="デフォルトカバー"
                        className="w-full h-full object-cover"
                    />
                    {coverOverlay && (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pl-2 bg-gradient-to-l from-black/30 via-black/15 to-transparent">
                            {coverOverlay}
                        </div>
                    )}
                </div>
            )}

            {/* Avatar + Name + Inline Meta */}
            <div className="px-4 -mt-8 relative">
                {community.logoUrl ? (
                    <SingleImagePreview src={community.logoUrl} alt={community.name}>
                        <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                            <AvatarImage src={community.logoUrl} alt={community.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xl">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                    </SingleImagePreview>
                ) : (
                    <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xl">
                            {initial}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className="mt-2">
                    {/* グレードバッジ */}
                    <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${community.grade === 'PREMIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                            }`}
                    >
                        {community.grade === 'PREMIUM' ? '⭐ プレミアム' : 'フリー'}
                    </span>

                    {/* コミュニティ名 + メンバー数・公開/非公開・カテゴリ・タグ */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <h1 className="text-2xl font-bold text-gray-900 mr-1">{community.name}</h1>
                        <Link to={`/communities/${community.id}/members`}>
                            <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition-colors">
                                <Users className="w-3 h-3" />
                                {community.memberCount}人
                            </Badge>
                        </Link>
                        <Badge variant="secondary">
                            {community.isPublic ? '公開' : '非公開'}
                        </Badge>
                        {community.categories.map((cat) => (
                            <Badge key={cat.id} variant="outline" className="text-xs">
                                {cat.name}
                            </Badge>
                        ))}
                        {/* タグ（カテゴリの右横、展開式） */}
                        {visibleTags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                        {hasOverflow && (
                            <button
                                type="button"
                                onClick={() => setTagsExpanded((prev) => !prev)}
                                className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {tagsExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        閉じる
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        +{tags.length - TAG_COLLAPSE_LIMIT}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* コミュニティ説明 */}
                    {community.description && (
                        <p className="text-sm text-gray-600 mt-1">{community.description}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
