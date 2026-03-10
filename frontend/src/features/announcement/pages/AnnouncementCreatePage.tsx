import { useAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from '@/features/announcement/hooks/useAnnouncementQueries'
import { PollCreateForm } from '@/features/poll/components/PollCreateForm'
import { SectionTabs, type SectionTab } from '@/shared/components/SectionTabs'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { uploadFile } from '@/shared/lib/uploadClient'
import { ImagePlus, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * AnnouncementCreatePage — 投稿作成 / 編集画面（UBL-35 + UBL-34 タブ統合 + Phase3 編集プリフィル）
 *
 * 管理者以上が「お知らせ」または「投票」を作成する画面。
 * `?edit=:announcementId` クエリパラメータがある場合は編集モードとなり、
 * 既存データをプリフィルして PATCH で更新する。
 */
export function AnnouncementCreatePage() {
    const { communityId } = useParams<{ communityId: string }>()
    const [searchParams] = useSearchParams()
    const editId = searchParams.get('edit')
    const isEditMode = !!editId

    const navigate = useNavigate()
    const createAnnouncement = useCreateAnnouncement(communityId!)
    const updateAnnouncement = useUpdateAnnouncement(communityId!)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 編集モード時に既存データをフェッチ
    const { data: existingAnnouncement, isLoading: isLoadingExisting } = useAnnouncement(editId ?? '')

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [attachments, setAttachments] = useState<Array<{ url: string; name: string; mimeType: string; fileSize: number }>>([])
    const [uploading, setUploading] = useState(false)
    const [prefilled, setPrefilled] = useState(false)

    // 編集モード: 既存データでプリフィル（一度だけ）
    useEffect(() => {
        if (isEditMode && existingAnnouncement && !prefilled) {
            setTitle(existingAnnouncement.title)
            setContent(existingAnnouncement.content)
            setPrefilled(true)
        }
    }, [isEditMode, existingAnnouncement, prefilled])

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

        if (isEditMode && editId) {
            // 編集モード: PATCH
            updateAnnouncement.mutate(
                {
                    id: editId,
                    data: { title: title.trim(), content: content.trim() },
                },
                {
                    onSuccess: () => {
                        navigate(`/communities/${communityId}`)
                    },
                },
            )
        } else {
            // 新規作成モード: POST
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
    }

    const handlePollSuccess = () => {
        navigate(`/communities/${communityId}`)
    }

    const isMutating = createAnnouncement.isPending || updateAnnouncement.isPending

    // 編集モードの読み込み中
    if (isEditMode && isLoadingExisting) {
        return (
            <div className="p-4 text-center text-sm text-gray-400">読み込み中…</div>
        )
    }

    // ── お知らせ作成/編集フォーム ──
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
                disabled={!title.trim() || !content.trim() || isMutating}
            >
                <Send className="w-4 h-4 mr-2" />
                {isMutating
                    ? (isEditMode ? '更新中...' : '投稿中...')
                    : (isEditMode ? 'お知らせを更新' : 'お知らせを投稿')
                }
            </Button>
        </form>
    )

    // ── タブ定義 ──
    const tabs: SectionTab[] = isEditMode
        ? [{ value: 'announcement', label: 'お知らせ編集', content: announcementForm }]
        : [
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
