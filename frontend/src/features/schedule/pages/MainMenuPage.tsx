import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { CalendarDays, LogOut, Plus, Settings, Users } from 'lucide-react'

/**
 * メインメニューページ
 *
 * 認証済みユーザーのダッシュボード。
 * Activity（予定管理）のAPIはバックエンド未実装のため、プレースホルダーUI。
 */
export function MainMenuPage() {
    const { user, logout } = useAuth()

    const menuItems = [
        {
            icon: CalendarDays,
            title: '予定一覧',
            description: 'サークルの今後の予定を確認',
            disabled: true,
            comingSoon: true,
        },
        {
            icon: Plus,
            title: '予定を作成',
            description: '新しい活動予定を登録',
            disabled: true,
            comingSoon: true,
        },
        {
            icon: Users,
            title: 'メンバー',
            description: 'サークルメンバーの一覧',
            disabled: true,
            comingSoon: true,
        },
        {
            icon: Settings,
            title: '設定',
            description: 'アカウント設定・通知設定',
            disabled: true,
            comingSoon: true,
        },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <header className="border-b">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
                    <h1 className="text-xl font-bold">Schedy</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            ID: {user?.userId?.slice(0, 8)}...
                        </span>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            ログアウト
                        </Button>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold">メインメニュー</h2>
                    <p className="text-muted-foreground mt-1">サークルの予定を管理しましょう</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {menuItems.map((item) => (
                        <Card
                            key={item.title}
                            className={`relative cursor-pointer transition-colors hover:bg-accent/50 ${item.disabled ? 'opacity-60' : ''
                                }`}
                        >
                            {item.comingSoon && (
                                <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    準備中
                                </span>
                            )}
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent />
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}
