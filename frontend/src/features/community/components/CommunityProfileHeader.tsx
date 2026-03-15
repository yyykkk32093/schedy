import { useMyRole } from '@/features/community/hooks/useCommunityQueries'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import type { CommunityDetail } from '@/shared/types/api'
import { Banknote, BarChart3, ChevronDown, Clock, MapPin, Settings, Train, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

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
            {/* Cover image */}
            {community.coverUrl ? (
                <div className="w-full h-32 bg-gray-200 overflow-hidden">
                    <img
                        src={community.coverUrl}
                        alt="カバー画像"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="w-full h-24 bg-gradient-to-r from-blue-400 to-blue-600" />
            )}

            {/* Avatar + Name section */}
            <div className="px-4 -mt-8 relative">
                <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                    <AvatarImage src={community.logoUrl ?? undefined} alt={community.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xl">
                        {initial}
                    </AvatarFallback>
                </Avatar>

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
                                    決済管理
                                    <ChevronDown className="w-3 h-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => navigate(`/communities/${community.id}/refunds`)}>
                                        返金管理
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
