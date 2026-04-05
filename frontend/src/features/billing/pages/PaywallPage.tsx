/**
 * PaywallPage — RevenueCat Web SDK 版
 *
 * RevenueCat の Offerings を取得してプラン一覧を表示し、
 * Web Billing 経由でサブスクリプション購入・管理を行う。
 *
 * Stripe との連携は RevenueCat 内部で自動的に処理される。
 */

import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/shared/components/ui/button'
import { getOrConfigurePurchases, isRevenueCatConfigured } from '@/shared/lib/revenuecat'
import type { Offering, Purchases, Package as RCPackage } from '@revenuecat/purchases-js'
import { useCallback, useEffect, useRef, useState } from 'react'

/** 静的なプラン定義（UI 表示用） */
const plans = [
    {
        id: 'FREE',
        name: 'Free',
        price: '¥0',
        period: '',
        features: [
            'コミュニティ参加',
            'スケジュール閲覧・参加',
            'チャット利用',
            'お知らせ閲覧',
        ],
        limitations: [
            'コミュニティ作成 1つまで',
            'アクティビティ作成 3つまで',
        ],
        highlight: false,
    },
    {
        id: 'SUBSCRIBER',
        name: 'Subscriber',
        price: '¥320',
        period: '/月',
        features: [
            'Free の全機能',
            'コミュニティ無制限作成',
            'アクティビティ無制限作成',
            '参加費の徴収（Stripe Connect）',
            '高度な通知設定',
        ],
        limitations: [],
        highlight: true,
    },
    {
        id: 'LIFETIME',
        name: 'Lifetime',
        price: '¥5,980',
        period: '（買い切り）',
        features: [
            'Subscriber の全機能',
            '永久利用権',
            '将来の機能もすべて利用可能',
        ],
        limitations: [],
        highlight: false,
    },
]

export function PaywallPage() {
    const { user } = useAuth()
    const currentPlan = user?.plan ?? 'FREE'
    const [purchasing, setPurchasing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [offering, setOffering] = useState<Offering | null>(null)
    const purchasesRef = useRef<Purchases | null>(null)
    const purchaseTargetRef = useRef<HTMLDivElement>(null)

    // RevenueCat SDK を初期化して Offerings を取得
    useEffect(() => {
        if (!user?.userId || !isRevenueCatConfigured()) return

        const init = async () => {
            try {
                const purchases = getOrConfigurePurchases(user.userId)
                purchasesRef.current = purchases
                const offerings = await purchases.getOfferings()
                setOffering(offerings.current ?? null)
            } catch (err) {
                console.error('[RevenueCat] Failed to load offerings:', err)
            }
        }
        init()
    }, [user?.userId])

    /**
     * SUBSCRIBER プランの購入
     * RevenueCat の purchase() が Stripe の決済UIを自動でマウントする
     */
    const handleSubscribe = useCallback(async () => {
        if (!purchasesRef.current || !offering) return

        // offering から月額パッケージを探す
        const subscriberPkg: RCPackage | undefined =
            offering.monthly ?? offering.availablePackages[0]

        if (!subscriberPkg) {
            setError('購入可能なパッケージが見つかりません')
            return
        }

        setPurchasing(true)
        setError(null)

        try {
            await purchasesRef.current.purchase({
                rcPackage: subscriberPkg,
                customerEmail: user?.email,
                htmlTarget: purchaseTargetRef.current ?? undefined,
            })
            // 購入成功 → ページリロードで AuthProvider が新しい plan を取得
            window.location.reload()
        } catch (err) {
            // ユーザーがキャンセルした場合も含む
            const message = err instanceof Error ? err.message : '購入処理に失敗しました'
            setError(message)
        } finally {
            setPurchasing(false)
        }
    }, [offering, user?.email])

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">プランを選択</h1>
            <p className="text-gray-600 mb-6">
                現在のプラン:{' '}
                <span className="font-semibold text-blue-600">{currentPlan}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlan
                    return (
                        <div
                            key={plan.id}
                            className={`border rounded-xl p-5 flex flex-col ${plan.highlight
                                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/50'
                                : 'border-gray-200'
                                }`}
                        >
                            {plan.highlight && (
                                <span className="text-xs font-semibold text-blue-600 mb-2">
                                    おすすめ
                                </span>
                            )}
                            <h2 className="text-xl font-bold">{plan.name}</h2>
                            <p className="mt-2 mb-4">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                <span className="text-gray-500 text-sm">{plan.period}</span>
                            </p>
                            <ul className="space-y-2 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="text-sm text-gray-700 flex items-start gap-1.5">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        {f}
                                    </li>
                                ))}
                                {plan.limitations.map((l) => (
                                    <li key={l} className="text-sm text-gray-400 flex items-start gap-1.5">
                                        <span className="text-gray-300 mt-0.5">—</span>
                                        {l}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4">
                                {isCurrent ? (
                                    <span className="block text-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                                        現在のプラン
                                    </span>
                                ) : plan.id === 'SUBSCRIBER' && currentPlan === 'FREE' ? (
                                    <Button
                                        className="w-full"
                                        onClick={handleSubscribe}
                                        disabled={purchasing || !offering}
                                    >
                                        {purchasing ? '処理中...' : 'アップグレード'}
                                    </Button>
                                ) : plan.id === 'FREE' && currentPlan !== 'FREE' ? (
                                    <span className="block text-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">
                                        RevenueCat 管理画面から解約
                                    </span>
                                ) : plan.id === 'LIFETIME' ? (
                                    <span className="block text-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">
                                        📱 アプリから購入
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* RevenueCat 決済 UI のマウント先 */}
            <div ref={purchaseTargetRef} />

            {error && (
                <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-1">
                    💡 Lifetime プランについて
                </h3>
                <p className="text-sm text-yellow-700">
                    Lifetime プランの購入は iOS / Android アプリからお願いします。
                    アプリ内の「設定」→「プラン」から購入できます。
                </p>
            </div>
        </div>
    )
}
