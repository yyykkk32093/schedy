import { uploadFile, type UploadResult } from '@/shared/lib/uploadClient'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface FileUploadZoneProps {
    /** アップロード完了時のコールバック */
    onUploadComplete: (result: UploadResult) => void
    /** 許可する MIME タイプ（例: 'image/*'） */
    accept?: string
    /** 最大ファイルサイズ（バイト）デフォルト 10MB */
    maxSize?: number
    /** プレビュー表示するか */
    showPreview?: boolean
    /** ボタンラベル */
    label?: string
    /** 複数ファイルを許可するか */
    multiple?: boolean
    /** 複数ファイルアップロード完了時のコールバック */
    onMultiUploadComplete?: (results: UploadResult[]) => void
    /** カスタム className */
    className?: string
    /** 無効化 */
    disabled?: boolean
}

interface PreviewFile {
    file: File
    previewUrl: string
}

/**
 * FileUploadZone — ドラッグ&ドロップ対応のファイルアップロード共通コンポーネント
 *
 * Presigned URL フロー（uploadClient.ts）を使用。
 * プレビュー表示 + アップロード進行中のローディング表示。
 */
export function FileUploadZone({
    onUploadComplete,
    accept = 'image/*',
    maxSize = 10 * 1024 * 1024,
    showPreview = true,
    label = '写真を追加',
    multiple = false,
    onMultiUploadComplete,
    className = '',
    disabled = false,
}: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [previews, setPreviews] = useState<PreviewFile[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileArray = Array.from(files)

            // バリデーション
            const validFiles = fileArray.filter((f) => {
                if (f.size > maxSize) {
                    toast.error(`${f.name} はサイズが大きすぎます（最大 ${Math.round(maxSize / 1024 / 1024)}MB）`)
                    return false
                }
                return true
            })

            if (validFiles.length === 0) return

            // プレビュー生成
            if (showPreview) {
                const newPreviews = validFiles.map((file) => ({
                    file,
                    previewUrl: URL.createObjectURL(file),
                }))
                setPreviews((prev) => [...prev, ...newPreviews])
            }

            // アップロード
            setIsUploading(true)
            try {
                const results: UploadResult[] = []
                for (const file of validFiles) {
                    const result = await uploadFile(file)
                    results.push(result)
                    onUploadComplete(result)
                }
                if (multiple && onMultiUploadComplete) {
                    onMultiUploadComplete(results)
                }
            } catch (err) {
                toast.error('アップロードに失敗しました')
                console.error('Upload failed:', err)
            } finally {
                setIsUploading(false)
            }
        },
        [maxSize, showPreview, onUploadComplete, multiple, onMultiUploadComplete],
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            if (disabled || isUploading) return
            handleFiles(e.dataTransfer.files)
        },
        [disabled, isUploading, handleFiles],
    )

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                handleFiles(e.target.files)
            }
            // reset input for re-selection
            e.target.value = ''
        },
        [handleFiles],
    )

    const removePreview = useCallback((index: number) => {
        setPreviews((prev) => {
            const removed = prev[index]
            if (removed) URL.revokeObjectURL(removed.previewUrl)
            return prev.filter((_, i) => i !== index)
        })
    }, [])

    return (
        <div className={className}>
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && !isUploading && inputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <span className="text-sm text-gray-500">アップロード中...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-xs text-gray-400">
                            ドラッグ&ドロップ または クリックして選択
                        </span>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    className="hidden"
                />
            </div>

            {/* Previews */}
            {showPreview && previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                    {previews.map((p, index) => (
                        <div key={p.previewUrl} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={p.previewUrl}
                                alt={p.file.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removePreview(index)
                                }}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
