import { Button } from '@/shared/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'

interface UnsavedChangesDialogProps {
    open: boolean
    onDiscard: () => void
    onCancel: () => void
}

/**
 * UnsavedChangesDialog — 未保存変更の確認ダイアログ
 *
 * useUnsavedChangesWarning フックと組み合わせて使用。
 * #47（コミュニティ設定）・#57（マイページ）で共通利用。
 */
export function UnsavedChangesDialog({ open, onDiscard, onCancel }: UnsavedChangesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>変更が保存されていません</DialogTitle>
                    <DialogDescription>
                        保存されていない変更があります。このまま移動すると変更内容は失われます。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onCancel}>
                        戻る
                    </Button>
                    <Button variant="destructive" onClick={onDiscard}>
                        破棄して移動
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
