import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * アプリ共通のトースト通知コンポーネント
 *
 * - shadcn/ui パターンに準拠した sonner ラッパー
 * - App.tsx のルートに1つだけ配置する
 * - 呼び出し側は `import { toast } from 'sonner'` で直接利用
 */
export function Toaster(props: ToasterProps) {
    return (
        <Sonner
            position="top-center"
            richColors
            duration={4000}
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'group border-border shadow-lg font-sans text-sm',
                    title: 'text-foreground font-medium',
                    description: 'text-muted-foreground',
                    closeButton: 'text-foreground/50',
                },
            }}
            {...props}
        />
    )
}
