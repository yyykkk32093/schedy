import { stripePromise } from '@/shared/lib/stripe'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { ExternalLink, HelpCircle, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface CreditCardPaymentModalProps {
    clientSecret: string
    totalAmount: number
    baseFee: number
    platformFee: number
    onSuccess: () => void
    onCancel: () => void
}

/**
 * カード決済フォーム。
 * PaymentIntent の clientSecret を受け取り、決済を処理する。
 */
function PaymentForm({ totalAmount, baseFee, platformFee, onSuccess, onCancel }: Omit<CreditCardPaymentModalProps, 'clientSecret'>) {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)
    const [showFeeDialog, setShowFeeDialog] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setIsProcessing(true)
        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href, // 3D Secure 用のリダイレクト先
                },
                redirect: 'if_required',
            })

            if (error) {
                toast.error(error.message ?? '決済に失敗しました')
            } else {
                toast.success('決済が完了しました')
                onSuccess()
            }
        } catch {
            toast.error('決済処理中にエラーが発生しました')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* 金額内訳 */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">参加費</span>
                    <span>¥{baseFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                        手数料
                        <button
                            type="button"
                            onClick={() => setShowFeeDialog(true)}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="手数料がかかる理由"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                    </span>
                    <span>¥{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>合計</span>
                    <span>¥{totalAmount.toLocaleString()}</span>
                </div>
            </div>

            {/* Stripe ブランディング + セキュリティ */}
            <div className="text-xs text-gray-500 space-y-1">
                <p>
                    支払いには{' '}
                    <a href="https://docs.stripe.com/security/stripe" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                        Stripe<ExternalLink className="w-3 h-3" />
                    </a>
                    {' '}社の決済サービスを利用しています。
                </p>
                <p className="text-[11px] text-gray-400">※ Tsunaca ではクレジットカード情報を保持しません。</p>
            </div>

            {/* カード情報入力 */}
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {isProcessing ? '処理中...' : `¥${totalAmount.toLocaleString()} を支払う`}
                </button>
            </div>

            {/* 手数料がかかる理由ダイアログ */}
            {showFeeDialog && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setShowFeeDialog(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold">手数料がかかる理由</h3>
                            <button type="button" onClick={() => setShowFeeDialog(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>クレジットカード決済では、決済サービス（Stripe）の利用料として手数料が発生します。</p>
                            <p>この手数料はカード会社への支払い処理・不正利用防止・セキュリティ維持にかかる費用です。</p>
                            <p className="text-xs text-gray-400">※ 手数料は参加キャンセル時に返金対象外となります。</p>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}

/**
 * カード決済モーダル。
 * clientSecret を受け取って Elements を初期化する。
 */
export function CreditCardPaymentModal(props: CreditCardPaymentModalProps) {
    if (!stripePromise) {
        return (
            <div className="p-4 text-center text-red-500 text-sm">
                決済サービスが設定されていません。管理者にお問い合わせください。
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h2 className="text-lg font-semibold mb-4">お支払い</h2>
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret: props.clientSecret,
                        appearance: {
                            theme: 'stripe',
                            variables: {
                                colorPrimary: '#2563eb',
                                borderRadius: '8px',
                            },
                        },
                        locale: 'ja',
                    }}
                >
                    <PaymentForm
                        totalAmount={props.totalAmount}
                        baseFee={props.baseFee}
                        platformFee={props.platformFee}
                        onSuccess={props.onSuccess}
                        onCancel={props.onCancel}
                    />
                </Elements>
            </div>
        </div>
    )
}
