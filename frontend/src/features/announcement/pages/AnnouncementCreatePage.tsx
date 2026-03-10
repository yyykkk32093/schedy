import { useCreateAnnouncement } from '@/features/announcement/hooks/useAnnouncementQueries'
import { PollCreateForm } from '@/features/poll/components/PollCreateForm'
import { SectionTabs, type SectionTab } from '@/shared/components/SectionTabs'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { uploadFile } from '@/shared/lib/uploadClient'
import { ImagePlus, Send, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * AnnouncementCreatePage — 投稿作成画面（UBL-35 + UBL-34 タブ統合）
 *
 * 管理者以上が「お知らせ」または「投票」を作成する画面。
 * タブで切り替え（同一パス + ステート管理）。
 */
export function AnnouncementCreatePage() {
    const { communityId } = useParams<{ communityId: string }>()
    const navigate = useNavigate()
    const createAnnouncement = useCreateAnnouncement(communityId!)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [attachments, setAttachments] = useState<Array<{ url: string; name: string; mimeType: string; fileSize: number }>>([])
    const [uploading, setUploading] = useState(false)

    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const result = await uploadFile(file)
            setAttachments((prev) => [...prev, { url: result.url, name: result.fileName, mimeType: result.mimeType, fileSize: result.fileSize }])
        } catch {
            // upload error — silently ignore
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        createAnnouncement.mutate(
            {
                title: title.trim(),
                content: content.trim(),
                attachments: attachments.length > 0
                    ? attachments.map((att) => ({ fileUrl: att.url, fileName: att.name, mimeType: att.mimeType, fileSize: att.fileSize }))
                    : undefined,
            },
            {
                onSuccess: () => {
                    navigate(`/communities/${communityId}`)
                },
            },
        )
    }

    const handlePollSuccess = () => {
        navigate(`/communities/${communityId}`)
    }

    // ── お知らせ作成フォーム ──
    const announcementForm = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">タイトル</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="お知らせのタイトル"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">本文</Label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="お知らせの内容を入力..."
                        rows={6}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Attachments preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                            <div key={i} className="relative group">
                                <img
                                    src={att.url}
                                    alt={att.name}
                                    className="h-20 w-20 object-cover rounded-lg border"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(i)}
                                    className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Image upload button */}
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <ImagePlus className="w-4 h-4 mr-1" />
                        {uploading ? 'アップロード中...' : '画像を添付'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddImage}
                    />
                </div>
            </Card>

            <Button
                type="submit"
                className="w-full"
                disabled={!title.trim() || !content.trim() || createAnnouncement.isPending}
            >
                <Send className="w-4 h-4 mr-2" />
                {createAnnouncement.isPending ? '投稿中...' : 'お知らせを投稿'}
            </Button>
        </form>
    )

    // ── タブ定義 ──
    const tabs: SectionTab[] = [
        { value: 'announcement', label: 'お知らせ', content: announcementForm },
        {
            value: 'poll',
            label: '投票',
            content: <PollCreateForm communityId={communityId!} onSuccess={handlePollSuccess} />,
        },
    ]

    return (
        <div className="p-4 space-y-4">
            <SectionTabs tabs={tabs} defaultValue="announcement" />
        </div>
    )
}
