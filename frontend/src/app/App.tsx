import { createPlatformPorts } from '@/app/platformDetect'
import { PlatformProvider } from '@/app/providers/PlatformProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { ActivityCreatePage } from '@/features/activity/pages/ActivityCreatePage'
import { ActivityDetailPage } from '@/features/activity/pages/ActivityDetailPage'
import { ActivityEditPage } from '@/features/activity/pages/ActivityEditPage'
import { ActivityListPage } from '@/features/activity/pages/ActivityListPage'
import { ActivityTopPage } from '@/features/activity/pages/ActivityTopPage'
import { AnnouncementCreatePage } from '@/features/announcement/pages/AnnouncementCreatePage'
import { AnnouncementDetailPage } from '@/features/announcement/pages/AnnouncementDetailPage'
import { AnnouncementListPage } from '@/features/announcement/pages/AnnouncementListPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { OAuthCallbackPage } from '@/features/auth/pages/OAuthCallbackPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { PaywallPage } from '@/features/billing/pages/PaywallPage'
import { ChannelPage } from '@/features/chat/pages/ChannelPage'
import { ChatListPage } from '@/features/chat/pages/ChatListPage'
import { AnalyticsPage } from '@/features/community/pages/AnalyticsPage'
import { CommunityCreatePage } from '@/features/community/pages/CommunityCreatePage'
import { CommunityDetailPage } from '@/features/community/pages/CommunityDetailPage'
import { CommunityJoinPage } from '@/features/community/pages/CommunityJoinPage'
import { CommunityListPage } from '@/features/community/pages/CommunityListPage'
import { CommunitySearchDetailPage } from '@/features/community/pages/CommunitySearchDetailPage'
import { CommunitySearchPage } from '@/features/community/pages/CommunitySearchPage'
import CommunitySettingsPage from '@/features/community/pages/CommunitySettingsPage'
import InviteAcceptPage from '@/features/community/pages/InviteAcceptPage'
import { MemberListPage } from '@/features/community/pages/MemberListPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { NotificationListPage } from '@/features/notification/pages/NotificationListPage'
import { RefundHistoryPage } from '@/features/participation/pages/RefundHistoryPage'
import { RefundManagementPage } from '@/features/participation/pages/RefundManagementPage'
import { ScheduleDetailPage } from '@/features/schedule/pages/ScheduleDetailPage'
import { ScheduleListPage } from '@/features/schedule/pages/ScheduleListPage'
import { StampListPage } from '@/features/stamp/pages/StampListPage'
import { MyPage } from '@/features/user/pages/MyPage'
import { AppLayout } from '@/shared/components/AppLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { Toaster } from '@/shared/components/ui/sonner'
import type { RouteHandle } from '@/shared/types/route'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

const ports = createPlatformPorts()

/**
 * ルート定義
 *
 * handle: { title, showBack } で画面ごとのヘッダー情報を宣言的に管理。
 * AppLayout が useMatches() で取得してヘッダーに反映する。
 */
const router = createBrowserRouter([
    {
        // ルートレイアウト: AuthProvider + AppLayout
        element: <AppLayout />,
        children: [
            // ── 認証不要 ──
            {
                path: '/login',
                element: <LoginPage />,
                handle: { title: '', showBack: false } satisfies RouteHandle,
            },
            {
                path: '/signup',
                element: <SignupPage />,
                handle: { title: '新規登録', showBack: true } satisfies RouteHandle,
            },
            {
                path: '/auth/callback/:provider',
                element: <OAuthCallbackPage />,
                handle: { title: '', showBack: false } satisfies RouteHandle,
            },

            // ── 認証必要 ──
            {
                element: <ProtectedRoute />,
                children: [
                    // Home
                    {
                        path: '/home',
                        element: <HomePage />,
                        handle: { title: 'ホーム', showBack: false } satisfies RouteHandle,
                    },

                    // Community
                    {
                        path: '/communities',
                        element: <CommunityListPage />,
                        handle: { title: 'コミュニティ', showBack: false } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/create',
                        element: <CommunityCreatePage />,
                        handle: { title: 'コミュニティ作成', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/search',
                        element: <CommunitySearchPage />,
                        handle: { title: 'コミュニティ検索', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/search/:id',
                        element: <CommunitySearchDetailPage />,
                        handle: { title: 'コミュニティ検索詳細', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/search/:id/join',
                        element: <CommunityJoinPage />,
                        handle: { title: 'コミュニティ参加', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/:id',
                        element: <CommunityDetailPage />,
                        handle: { title: 'コミュニティ詳細', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/:id/analytics',
                        element: <AnalyticsPage />,
                        handle: { title: '統計', showBack: true } satisfies RouteHandle,
                    },

                    // Activity（コミュニティ配下）
                    {
                        path: '/communities/:communityId/activities',
                        element: <ActivityListPage />,
                        handle: { title: 'アクティビティ一覧', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/:communityId/activities/new',
                        element: <ActivityCreatePage />,
                        handle: { title: 'アクティビティ作成', showBack: true } satisfies RouteHandle,
                    },

                    // Activity（トップレベル）
                    {
                        path: '/activities',
                        element: <ActivityTopPage />,
                        handle: { title: 'アクティビティ', showBack: false } satisfies RouteHandle,
                    },
                    {
                        path: '/activities/create',
                        element: <ActivityCreatePage />,
                        handle: { title: 'アクティビティ作成', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/activities/:id',
                        element: <ActivityDetailPage />,
                        handle: { title: 'アクティビティ詳細', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/activities/:id/edit',
                        element: <ActivityEditPage />,
                        handle: { title: 'アクティビティ更新', showBack: true } satisfies RouteHandle,
                    },

                    // Schedule
                    {
                        path: '/activities/:activityId/schedules',
                        element: <ScheduleListPage />,
                        handle: { title: 'スケジュール一覧', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/schedules/:id',
                        element: <ScheduleDetailPage />,
                        handle: { title: 'スケジュール詳細', showBack: true } satisfies RouteHandle,
                    },

                    // Announcement
                    {
                        path: '/communities/:communityId/announcements',
                        element: <AnnouncementListPage />,
                        handle: { title: 'お知らせ', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/:communityId/announcements/new',
                        element: <AnnouncementCreatePage />,
                        handle: { title: '投稿作成', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/announcements/:id',
                        element: <AnnouncementDetailPage />,
                        handle: { title: 'お知らせ詳細', showBack: true } satisfies RouteHandle,
                    },

                    // Members (UBL-33)
                    {
                        path: '/communities/:id/members',
                        element: <MemberListPage />,
                        handle: { title: 'メンバー一覧', showBack: true } satisfies RouteHandle,
                    },

                    // Community Settings (UBL-10)
                    {
                        path: '/communities/:id/settings',
                        element: <CommunitySettingsPage />,
                        handle: { title: 'コミュニティ設定', showBack: true } satisfies RouteHandle,
                    },

                    // 返金管理（管理者向け）
                    {
                        path: '/communities/:id/refunds',
                        element: <RefundManagementPage />,
                        handle: { title: '返金管理', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/communities/:id/refunds/history',
                        element: <RefundHistoryPage />,
                        handle: { title: '返金履歴', showBack: true } satisfies RouteHandle,
                    },

                    // MyPage (UBL-32)
                    {
                        path: '/mypage',
                        element: <MyPage />,
                        handle: { title: 'マイページ', showBack: true } satisfies RouteHandle,
                    },

                    // Invite Accept (UBL-11)
                    {
                        path: '/invites/:token/accept',
                        element: <InviteAcceptPage />,
                        handle: { title: '招待', showBack: true } satisfies RouteHandle,
                    },

                    // Chat
                    {
                        path: '/chats',
                        element: <ChatListPage />,
                        handle: { title: 'チャット', showBack: false } satisfies RouteHandle,
                    },
                    {
                        path: '/chats/:channelId',
                        element: <ChannelPage />,
                        handle: { title: 'チャット', showBack: true } satisfies RouteHandle,
                    },
                    {
                        path: '/channels/:channelId',
                        element: <ChannelPage />,
                        handle: { title: 'チャット', showBack: true } satisfies RouteHandle,
                    },

                    // DM → チャット一覧にリダイレクト（DM導線はチャット一覧に統合）
                    {
                        path: '/dm',
                        element: <Navigate to="/chats" replace />,
                    },

                    // Stamp
                    {
                        path: '/stamps',
                        element: <StampListPage />,
                        handle: { title: 'スタンプ', showBack: true } satisfies RouteHandle,
                    },

                    // Notification
                    {
                        path: '/notifications',
                        element: <NotificationListPage />,
                        handle: { title: '通知', showBack: true } satisfies RouteHandle,
                    },

                    // Paywall
                    {
                        path: '/paywall',
                        element: <PaywallPage />,
                        handle: { title: 'プラン', showBack: true } satisfies RouteHandle,
                    },
                ],
            },

            // ── リダイレクト ──
            {
                path: '/',
                element: <Navigate to="/home" replace />,
            },
            {
                path: '*',
                element: <Navigate to="/login" replace />,
            },
        ],
    },
])

export default function App() {
    return (
        <PlatformProvider ports={ports}>
            <QueryProvider>
                <RouterProvider router={router} />
                <Toaster />
            </QueryProvider>
        </PlatformProvider>
    )
}
