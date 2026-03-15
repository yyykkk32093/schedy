import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import type { ReactNode } from 'react'

export interface SectionTab {
    /** タブの一意識別子 */
    value: string
    /** タブに表示するラベル */
    label: string
    /** タブのコンテンツ */
    content: ReactNode
}

interface SectionTabsProps {
    /** タブ定義の配列 */
    tabs: SectionTab[]
    /** デフォルトで選択するタブの value（省略時は最初のタブ）— 非制御モード */
    defaultValue?: string
    /** 現在のタブ value — 指定すると制御モード */
    value?: string
    /** タブ変更時のコールバック */
    onValueChange?: (value: string) => void
    /** タブリストの追加クラス */
    className?: string
}

/**
 * SectionTabs — 汎用セクションタブコンポーネント
 *
 * shadcn/ui Tabs をベースに、{ label, value, content } の配列を渡すだけで
 * タブ付きセクションを構築できる。
 *
 * 利用想定:
 * - コミュニティ詳細: カレンダー / タイムライン / アナウンスメント / アルバム
 * - アクティビティ画面: カレンダー / タイムライン
 */
export function SectionTabs({
    tabs,
    defaultValue,
    value,
    onValueChange,
    className,
}: SectionTabsProps) {
    const defaultTab = defaultValue ?? tabs[0]?.value

    // 制御モード（value 指定時）と非制御モード（defaultValue のみ）を切り替え
    const tabsProps = value != null
        ? { value, onValueChange }
        : { defaultValue: defaultTab, onValueChange }

    return (
        <Tabs {...tabsProps} className="w-full">
            <TabsList className={`w-full justify-start ${className ?? ''}`}>
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    {tab.content}
                </TabsContent>
            ))}
        </Tabs>
    )
}
