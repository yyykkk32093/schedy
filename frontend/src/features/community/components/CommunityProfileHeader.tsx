import { useMyRole } from '@/features/community/hooks/useCommunityQueries'
import type { CommunityDetail } from '@/shared/types/api'
import { SubCommunityCarousel } from './SubCommunityCarousel'
import { ActionBar } from './header/ActionBar'
import { HeroSection } from './header/HeroSection'
import { MetaSection } from './header/MetaSection'

interface CommunityProfileHeaderProps {
    community: CommunityDetail
}

/**
 * CommunityProfileHeader — コミュニティ詳細のプロフィールヘッダー
 *
 * 3つのサブコンポーネントで構成:
 * - HeroSection: カバー画像 + アバター + 名前(+メンバー数・公開/非公開・カテゴリ・タグ) + 説明
 *   - カバー画像右端にサブコミュニティカルーセルをオーバーレイ配置
 * - MetaSection: 活動場所(楕円重ね)・開催頻度・活動日・レベル
 * - ActionBar: 管理者アクション
 */
export function CommunityProfileHeader({ community }: CommunityProfileHeaderProps) {
    const { isAdminOrAbove } = useMyRole(community.id)

    const carouselOverlay = (
        <SubCommunityCarousel
            communityId={community.id}
            isAdminOrAbove={isAdminOrAbove}
            parentId={community.parentId}
        />
    )

    return (
        <div>
            <HeroSection community={community} coverOverlay={carouselOverlay} />

            <div className="px-4 mt-3 space-y-3">
                <MetaSection community={community} />
                <ActionBar communityId={community.id} isAdminOrAbove={isAdminOrAbove} />
            </div>
        </div>
    )
}
