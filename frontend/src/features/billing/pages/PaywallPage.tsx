import { useAuth } from '@/app/providers/AuthProvider'

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
                                ) : plan.id === 'FREE' ? null : (
                                    <span className="block text-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                        📱 アプリからアップグレード
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-1">
                    💡 Web 版でのアップグレードについて
                </h3>
                <p className="text-sm text-yellow-700">
                    サブスクリプションの購入・変更は iOS / Android アプリからお願いします。
                    アプリ内の「設定」→「プラン」からアップグレードできます。
                </p>
            </div>
        </div>
    )
}
