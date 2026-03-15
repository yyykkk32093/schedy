import { stripePromise } from '@/shared/lib/stripe'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import { toast } from 'sonner'

interface StripePaymentModalProps {
    clientSecret: string
    totalAmount: number
    baseFee: number
    platformFee: number
    onSuccess: () => void
    onCancel: () => void
}

/**
 * Stripe Payment Element を使った決済フォーム。
 * PaymentIntent の clientSecret を受け取り、カード決済を処理する。
 */
function PaymentForm({ totalAmount, baseFee, platformFee, onSuccess, onCancel }: Omit<StripePaymentModalProps, 'clientSecret'>) {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)

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
                <div className="flex justify-between">
                    <span className="text-gray-600">手数料</span>
                    <span>¥{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>合計</span>
                    <span>¥{totalAmount.toLocaleString()}</span>
                </div>
            </div>

            {/* Stripe Payment Element */}
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
        </form>
    )
}

/**
 * Stripe Elements Provider でラップした決済モーダル。
 * clientSecret を受け取って <Elements> を初期化する。
 */
export function StripePaymentModal(props: StripePaymentModalProps) {
    if (!stripePromise) {
        return (
            <div className="p-4 text-center text-red-500 text-sm">
                Stripe が設定されていません。管理者にお問い合わせください。
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
