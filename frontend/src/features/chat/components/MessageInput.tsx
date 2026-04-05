import { Image, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface MessageInputProps {
    onSend: (content: string, files: File[]) => void
    isSending: boolean
    /** プレースホルダーテキスト */
    placeholder?: string
}

/**
 * メッセージ入力エリア — Mockup準拠
 * テキスト入力 + マイク / 絵文字 / 画像 アイコン
 */
export function MessageInput({ onSend, isSending, placeholder = 'Message...' }: MessageInputProps) {
    const [content, setContent] = useState('')
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() && pendingFiles.length === 0) return
        onSend(content.trim(), [...pendingFiles])
        setContent('')
        setPendingFiles([])
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) setPendingFiles((prev) => [...prev, ...Array.from(files)])
        e.target.value = ''
    }

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
    }

    // 画像ファイルのプレビューURL生成（メモリリーク防止）
    const previewUrls = useMemo(() => {
        return pendingFiles.map((file) =>
            file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        )
    }, [pendingFiles])

    // プレビューURLのクリーンアップ
    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => url && URL.revokeObjectURL(url))
        }
    }, [previewUrls])

    return (
        <div className="border-t border-gray-100 bg-white">
            {/* 添付ファイルプレビュー */}
            {pendingFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap px-4 pt-2">
                    {pendingFiles.map((file, i) => {
                        const previewUrl = previewUrls[i]
                        return previewUrl ? (
                            // 画像: サムネイルプレビュー
                            <div key={i} className="relative group">
                                <img
                                    src={previewUrl}
                                    alt={file.name}
                                    className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePendingFile(i)}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            // 非画像: ファイル名表示
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                📎 {file.name}
                                <button type="button" onClick={() => removePendingFile(i)} className="text-red-400 hover:text-red-600">×</button>
                            </span>
                        )
                    })}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* テキスト入力 */}
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    maxLength={500}
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                />

                {/* アクションアイコン (#26: マイク削除, #27: 絵文字削除) */}
                <div className="flex items-center gap-3 text-gray-400">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:text-gray-600 transition-colors"
                        title="画像を添付"
                    >
                        <Image className="h-5 w-5" />
                    </button>
                </div>

                {/* 送信は Enter または content がある場合のみ */}
                {(content.trim() || pendingFiles.length > 0) && (
                    <button
                        type="submit"
                        disabled={isSending}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 ml-1"
                    >
                        送信
                    </button>
                )}
            </form>
        </div>
    )
}
