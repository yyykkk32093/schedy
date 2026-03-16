import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * useUnsavedChangesWarning — 未保存変更の離脱防止フック
 *
 * - SPA内遷移: React Router の useBlocker で確認ダイアログ表示
 * - ブラウザ離脱/リロード: beforeunload イベントでネイティブダイアログ表示
 *
 * @param isDirty フォームに未保存の変更があるかどうか
 * @returns { isBlocked, proceed, cancel } — ブロック状態と確認/キャンセル関数
 *
 * 使い方:
 * ```tsx
 * const { isBlocked, proceed, cancel } = useUnsavedChangesWarning(isDirty)
 *
 * <UnsavedChangesDialog open={isBlocked} onDiscard={proceed} onCancel={cancel} />
 * ```
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
    const blocker = useBlocker(isDirty)
    const [isBlocked, setIsBlocked] = useState(false)

    // useBlocker の状態に同期
    useEffect(() => {
        setIsBlocked(blocker.state === 'blocked')
    }, [blocker.state])

    // ブラウザ離脱時の beforeunload
    useEffect(() => {
        if (!isDirty) return

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [isDirty])

    const proceed = () => {
        if (blocker.state === 'blocked') {
            blocker.proceed()
        }
    }

    const cancel = () => {
        if (blocker.state === 'blocked') {
            blocker.reset()
        }
    }

    return { isBlocked, proceed, cancel }
}
