import { Image, Mic, Smile } from 'lucide-react'
import { useRef, useState } from 'react'

interface MessageInputProps {
    onSend: (content: string, files: File[]) => void
    isSending: boolean
}

/**
 * メッセージ入力エリア — Mockup準拠
 * テキスト入力 + マイク / 絵文字 / 画像 アイコン
 */
export function MessageInput({ onSend, isSending }: MessageInputProps) {
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

    return (
        <div className="border-t border-gray-100 bg-white">
            {/* 添付ファイルプレビュー */}
            {pendingFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap px-4 pt-2">
                    {pendingFiles.map((file, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            📎 {file.name}
                            <button type="button" onClick={() => removePendingFile(i)} className="text-red-400 hover:text-red-600">×</button>
                        </span>
                    ))}
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
                    placeholder="Message..."
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                />

                {/* アクションアイコン */}
                <div className="flex items-center gap-3 text-gray-400">
                    <button
                        type="button"
                        className="hover:text-gray-600 transition-colors"
                        title="音声"
                    >
                        <Mic className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        className="hover:text-gray-600 transition-colors"
                        title="絵文字"
                    >
                        <Smile className="h-5 w-5" />
                    </button>
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
