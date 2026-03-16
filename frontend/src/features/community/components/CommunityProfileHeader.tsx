import { communityApi } from '@/features/community/api/communityApi'
import { useMyRole } from '@/features/community/hooks/useCommunityQueries'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { SingleImagePreview } from '@/shared/components/ui/ImagePreviewModal'
import type { CommunityDetail } from '@/shared/types/api'
import { useMutation } from '@tanstack/react-query'
import { Banknote, BarChart3, ChevronDown, Clock, MapPin, Settings, Train, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface CommunityProfileHeaderProps {
    community: CommunityDetail
}

/**
 * CommunityProfileHeader — コミュニティ詳細のプロフィールヘッダー
 *
 * カバー画像 + アバター + 名前 + 説明 + メタ情報バッジ群
 */
export function CommunityProfileHeader({ community }: CommunityProfileHeaderProps) {
    const initial = community.name.charAt(0)
    const { isAdminOrAbove } = useMyRole(community.id)
    const navigate = useNavigate()

    return (
        <div>
            {/* Cover image — #14: タップで拡大表示 */}
            {community.coverUrl ? (
                <SingleImagePreview src={community.coverUrl} alt="カバー画像">
                    <div className="w-full h-32 bg-gray-200 overflow-hidden">
                        <img
                            src={community.coverUrl}
                            alt="カバー画像"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </SingleImagePreview>
            ) : (
                <div className="w-full h-24 bg-gradient-to-r from-blue-400 to-blue-600" />
            )}

            {/* Avatar + Name section — #14: アバタータップで拡大表示 */}
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
                    <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
                    {community.description && (
                        <p className="text-sm text-gray-600 mt-1">{community.description}</p>
                    )}
                </div>

                {/* Meta info row */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Link to={`/communities/${community.id}/members`}>
                        <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition-colors">
                            <Users className="w-3 h-3" />
                            {community.memberCount}人
                        </Badge>
                    </Link>

                    {community.mainActivityArea && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {community.mainActivityArea}
                        </Badge>
                    )}

                    {community.nearestStation && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Train className="w-3 h-3" />
                            {community.nearestStation}
                        </Badge>
                    )}

                    {community.activityFrequency && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {community.activityFrequency}
                        </Badge>
                    )}

                    {community.isPublic ? (
                        <Badge variant="secondary">公開</Badge>
                    ) : (
                        <Badge variant="secondary">非公開</Badge>
                    )}

                    {/* #15: 招待ボタン */}
                    <InviteButton communityId={community.id} />

                    {/* 2-2, 2-3: 統計・設定ボタン（OWNER/ADMIN のみ） */}
                    {isAdminOrAbove && (
                        <>
                            <Link
                                to={`/communities/${community.id}/analytics`}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                統計
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 outline-none">
                                    <Banknote className="w-3.5 h-3.5" />
                                    集金管理
                                    <ChevronDown className="w-3 h-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => navigate(`/communities/${community.id}/refunds`)}>
                                        返金一覧
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/communities/${community.id}/finance`)}>
                                        経費管理
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Link
                                to={`/communities/${community.id}/settings`}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                設定
                            </Link>
                        </>
                    )}
                </div>

                {/* Categories */}
                {community.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {community.categories.map((cat) => (
                            <Badge key={cat.id} variant="outline" className="text-xs">
                                {cat.name}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {community.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Activity days */}
                {community.activityDays.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs text-gray-500">活動日:</span>
                        {community.activityDays.map((day) => (
                            <span
                                key={day}
                                className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                                {dayLabel(day)}
                            </span>
                        ))}
                    </div>
                )}

                {/* Participation levels */}
                {community.participationLevels.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs text-gray-500">レベル:</span>
                        {community.participationLevels.map((level) => (
                            <span
                                key={level.id}
                                className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded"
                            >
                                {level.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
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
 * #15: 招待ボタン — トークン生成 + クリップボードコピー
 */
function InviteButton({ communityId }: { communityId: string }) {
    const [isPending, setIsPending] = useState(false)
    const generateInvite = useMutation({
        mutationFn: () => communityApi.generateInviteToken(communityId),
    })

    const handleInvite = async () => {
        setIsPending(true)
        try {
            const result = await generateInvite.mutateAsync()
            const link = `${window.location.origin}/invites/${result.token}/accept`
            await navigator.clipboard.writeText(link)
            toast.success('招待リンクをコピーしました')
        } catch {
            toast.error('招待リンクの生成に失敗しました')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleInvite}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
            <UserPlus className="w-3.5 h-3.5" />
            招待
        </button>
    )
}
