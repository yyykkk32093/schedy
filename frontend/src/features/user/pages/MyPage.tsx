import { useUpdateUserProfile, useUserProfile } from '@/features/user/hooks/useUserQueries'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { uploadFile } from '@/shared/lib/uploadClient'
import { Camera, Save } from 'lucide-react'
import { useRef, useState } from 'react'

/**
 * MyPage — マイページ（UBL-32）
 *
 * プロフィール画像・表示名・自己紹介を編集。
 * 将来的に招待受諾UI（UBL-11）もここに追加。
 */
export function MyPage() {
    const { data: profile, isLoading } = useUserProfile()
    const updateProfile = useUpdateUserProfile()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [displayName, setDisplayName] = useState<string | null>(null)
    const [biography, setBiography] = useState<string | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    // Initialize form from profile data
    const currentDisplayName = displayName ?? profile?.displayName ?? ''
    const currentBiography = biography ?? profile?.biography ?? ''
    const currentAvatarUrl = avatarPreview ?? profile?.avatarUrl ?? null

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!profile) {
        return <div className="p-6 text-center text-red-500">プロフィールが取得できません</div>
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const result = await uploadFile(file)
            setAvatarPreview(result.url)
        } catch {
            // upload error — silently ignore for now
        } finally {
            setUploading(false)
        }
    }

    const handleSave = () => {
        updateProfile.mutate({
            displayName: displayName !== null ? displayName : undefined,
            biography: biography !== null ? biography : undefined,
            avatarUrl: avatarPreview !== null ? avatarPreview : undefined,
        })
    }

    const isDirty = displayName !== null || biography !== null || avatarPreview !== null

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-xl font-bold text-gray-900">マイページ</h1>

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        <AvatarImage src={currentAvatarUrl ?? undefined} alt={currentDisplayName} />
                        <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                            {currentDisplayName?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                    </Avatar>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors"
                        aria-label="写真を変更"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>
                {uploading && <span className="text-xs text-gray-500">アップロード中...</span>}
            </div>

            {/* Profile Form */}
            <Card className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">表示名</Label>
                    <Input
                        id="displayName"
                        value={currentDisplayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="表示名を入力"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                        id="email"
                        value={profile.email ?? ''}
                        disabled
                        className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-400">メールアドレスは変更できません</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="biography">自己紹介</Label>
                    <textarea
                        id="biography"
                        value={currentBiography}
                        onChange={(e) => setBiography(e.target.value)}
                        placeholder="自己紹介を入力"
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="space-y-2">
                    <Label>プラン</Label>
                    <p className="text-sm font-medium text-gray-700">{profile.plan}</p>
                </div>
            </Card>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={!isDirty || updateProfile.isPending}
                className="w-full"
            >
                <Save className="w-4 h-4 mr-2" />
                {updateProfile.isPending ? '保存中...' : '保存'}
            </Button>
        </div>
    )
}
