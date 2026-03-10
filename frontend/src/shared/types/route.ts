/**
 * ルートの handle メタデータ型
 *
 * createBrowserRouter のルート定義で handle プロパティに付与し、
 * AppLayout が useMatches() で取得してヘッダーに反映する。
 */
export interface RouteHandle {
    /** ヘッダーに表示するタイトル（空文字の場合はヘッダー非表示） */
    title: string
    /** 戻るボタンを表示するか */
    showBack: boolean
}
