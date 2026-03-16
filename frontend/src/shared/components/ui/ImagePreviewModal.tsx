import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

interface ImagePreviewItem {
    src: string
    alt?: string
}

interface ImagePreviewGalleryProps {
    /** 表示する画像の配列 */
    images: ImagePreviewItem[]
    /** 各画像に適用するクラス名 */
    className?: string
    /** 画像が0件の場合は何も表示しない */
    children?: never
}

interface SingleImagePreviewProps {
    /** 表示する画像のURL */
    src: string
    /** alt テキスト */
    alt?: string
    /** トリガーとなる子要素 */
    children: React.ReactNode
}

/**
 * ImagePreviewGallery — 複数画像をギャラリー形式で表示
 *
 * react-photo-view をラップ。画像タップでフルスクリーン表示（ピンチズーム・スワイプ対応）。
 * お知らせ（#2）・チャット（#24）の添付画像カルーセルで利用。
 */
export function ImagePreviewGallery({ images, className }: ImagePreviewGalleryProps) {
    if (images.length === 0) return null

    return (
        <PhotoProvider>
            {images.map((img, index) => (
                <PhotoView key={index} src={img.src}>
                    <img
                        src={img.src}
                        alt={img.alt ?? ''}
                        className={className ?? 'h-40 w-auto max-w-[240px] rounded-lg object-cover flex-shrink-0 cursor-pointer'}
                    />
                </PhotoView>
            ))}
        </PhotoProvider>
    )
}

/**
 * SingleImagePreview — 単一画像の拡大プレビュー
 *
 * 子要素をクリックするとフルスクリーン表示。
 * プロフィール画像（#2, #14）で利用。
 */
export function SingleImagePreview({ src, alt, children }: SingleImagePreviewProps) {
    return (
        <PhotoProvider>
            <PhotoView src={src}>
                <span className="cursor-pointer">{children}</span>
            </PhotoView>
        </PhotoProvider>
    )
}
