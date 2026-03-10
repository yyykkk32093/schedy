import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'

/**
 * HeaderActionsContext — ページ固有のヘッダーアクション・タイトルを AppLayout に注入する
 *
 * 使い方:
 *   useSetHeaderActions(<>🔍➕</>) → ヘッダー右側にアクションを表示
 *   useSetHeaderTitle('コミュニティ名') → ヘッダータイトルを動的に上書き
 *   コンポーネントのアンマウント時に自動的にクリアされる。
 */

type HeaderActionsContextType = {
    actions: ReactNode
    setActions: (actions: ReactNode) => void
    title: string | null
    setTitle: (title: string | null) => void
}

const HeaderActionsContext = createContext<HeaderActionsContextType>({
    actions: null,
    setActions: () => { },
    title: null,
    setTitle: () => { },
})

/** AppLayout のルートで1回だけラップする Provider */
export function HeaderActionsProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<ReactNode>(null)
    const [title, setTitle] = useState<string | null>(null)
    return (
        <HeaderActionsContext.Provider value={{ actions, setActions, title, setTitle }}>
            {children}
        </HeaderActionsContext.Provider>
    )
}

/**
 * ページコンポーネントから呼び出してヘッダーアクションを設定する Hook
 *
 * アンマウント時に自動クリア。
 *
 * @example
 * useSetHeaderActions(
 *   <>
 *     <button onClick={...}><Search /></button>
 *     <button onClick={...}><Plus /></button>
 *   </>
 * )
 */
export function useSetHeaderActions(actions: ReactNode) {
    const { setActions } = useContext(HeaderActionsContext)
    useEffect(() => {
        setActions(actions)
        return () => setActions(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actions])
}

/**
 * ページコンポーネントから呼び出してヘッダータイトルを動的に上書きする Hook
 *
 * route handle の title より優先される。アンマウント時に自動クリア。
 *
 * @example
 * useSetHeaderTitle(community.name)
 */
export function useSetHeaderTitle(title: string | null | undefined) {
    const { setTitle } = useContext(HeaderActionsContext)
    useEffect(() => {
        setTitle(title ?? null)
        return () => setTitle(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title])
}

/** AppLayout 内でヘッダーアクションを取得する Hook */
export function useHeaderActions(): ReactNode {
    return useContext(HeaderActionsContext).actions
}

/** AppLayout 内でヘッダータイトル（動的上書き）を取得する Hook */
export function useHeaderTitle(): string | null {
    return useContext(HeaderActionsContext).title
}
