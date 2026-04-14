import {
    useAttendSchedule,
    useCancelAttendance,
    useCancelWaitlist,
    useCreateCreditCardPaymentIntent,
    useJoinWaitlist,
    useParticipationHistory,
    useReportPayment,
    useSelectPaymentMethod,
} from '@/features/participation/hooks/useParticipationQueries'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreditCardPaymentModal } from './CreditCardPaymentModal'

const PAYMENT_LABELS: Record<string, string> = {
    CASH: '現金',
    PAYPAY: 'PayPay',
    CREDIT_CARD: 'カード決済',
}

export type MyScheduleStatus = 'none' | 'attending' | 'waitlisted'

interface ParticipationActionButtonProps {
    scheduleId: string
    /** 参加費がある場合 true（SplitButton で支払方法選択） */
    hasFee: boolean
    /** 参加費の金額 */
    participationFee?: number | null
    /** 自分の参加状態 */
    myStatus: MyScheduleStatus
    /** 上限に達している場合 true — none 状態時に「キャンセル待ち」ボタンを表示 */
    isFull?: boolean
    /** コミュニティで有効な支払い方法（例: ['CASH', 'PAYPAY']） */
    enabledPaymentMethods?: string[]
    /** 自分が管理者以上か */
    isAdminOrAbove?: boolean
    /** コミュニティの PayPay ID（PayPay 支払い案内に使用） */
    paypayId?: string | null
    /** 自分の参加情報ID（支払い報告に使用） */
    myParticipationId?: string | null
    /** 自分の支払い方法 */
    myPaymentMethod?: string | null
    /** 自分の支払いステータス */
    myPaymentStatus?: string | null
}

/**
 * ParticipationActionButton — 参加 / キャンセル / WL の統一コンポーネント
 *
 * myStatus に応じてボタンを出し分ける:
 * - none + !isFull      → 「参加する」（hasFee ならプルダウンで支払方法選択）
 * - none + isFull       → 「キャンセル待ち」
 * - attending           → 「参加取消」
 * - waitlisted          → 「キャンセル待ち取消」
 *
 * 4-4: PayPay 支払い済みキャンセル→再参加時はリンク非表示 + インフォメッセージ
 */
export function ParticipationActionButton({
    scheduleId,
    hasFee,
    participationFee,
    myStatus,
    isFull = false,
    enabledPaymentMethods = ['CASH'],
    isAdminOrAbove = false,
    paypayId,
    myParticipationId,
    myPaymentMethod,
    myPaymentStatus,
}: ParticipationActionButtonProps) {
    const attendMutation = useAttendSchedule(scheduleId)
    const cancelAttendanceMutation = useCancelAttendance(scheduleId)
    const joinWaitlistMutation = useJoinWaitlist(scheduleId)
    const cancelWaitlistMutation = useCancelWaitlist(scheduleId)
    const creditCardPaymentIntentMutation = useCreateCreditCardPaymentIntent(scheduleId)
    const reportPaymentMutation = useReportPayment(scheduleId)
    const selectPaymentMethodMutation = useSelectPaymentMethod(scheduleId)
    const queryClient = useQueryClient()

    // クレジットカード決済モーダル用ステート
    const [creditCardPaymentData, setCreditCardPaymentData] = useState<{
        clientSecret: string
        totalAmount: number
        baseFee: number
        platformFee: number
    } | null>(null)
    // ③ PayPay 支払い案内の表示フラグ
    const [showPayPayGuide, setShowPayPayGuide] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    // 確認ダイアログ用
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [showReportConfirm, setShowReportConfirm] = useState(false)

    // 4-4: 未参加 + 参加費あり の場合のみ履歴を取得
    const shouldFetchHistory = myStatus === 'none' && hasFee
    const { data: history } = useParticipationHistory(scheduleId, shouldFetchHistory)

    // PayPay 支払い済みキャンセル履歴がある場合、PayPay 選択肢を非表示にする
    const hidePayPay = history?.hasPaidCancellation === true && history.paymentMethod === 'PAYPAY'

    /** 支払い方法の選択肢（コミュニティ設定で有効/無効を制御） */
    const disabledReason = isAdminOrAbove
        ? '有効にする場合はコミュニティ設定→支払い方法の設定を行なってください'
        : '有効にするには管理者に問い合わせてください'

    /** Stripe 最低請求額 (50円) 未満の場合、クレジットカード選択を無効化 */
    const STRIPE_MIN_AMOUNT = 50
    const isFeeUnderStripeMin = participationFee != null && participationFee > 0 && participationFee < STRIPE_MIN_AMOUNT

    const paymentMethodOptions = useMemo(() => {
        return Object.entries(PAYMENT_LABELS).map(([value, label]) => {
            // PayPay 支払い済みキャンセル→再参加時は無効化
            if (hidePayPay && value === 'PAYPAY') return { value, label, disabled: true, reason: '' }
            // 参加費が Stripe 最低請求額未満の場合、クレジットカードを無効化
            if (isFeeUnderStripeMin && value === 'CREDIT_CARD') return { value, label, disabled: true, reason: `カード決済は${STRIPE_MIN_AMOUNT}円以上から利用できます` }
            // コミュニティで無効な支払い方法
            if (!enabledPaymentMethods.includes(value)) return { value, label, disabled: true, reason: disabledReason }
            return { value, label, disabled: false, reason: '' }
        })
    }, [hidePayPay, enabledPaymentMethods, disabledReason, isFeeUnderStripeMin])

    const [paymentMethod, setPaymentMethod] = useState('CASH')

    // PayPay が非表示になった場合、選択値をリセット
    useEffect(() => {
        if (hidePayPay && paymentMethod === 'PAYPAY') {
            setPaymentMethod('CASH')
        }
    }, [hidePayPay, paymentMethod])

    // Stripe最低額未満でCC選択中なら CASH にリセット
    useEffect(() => {
        if (isFeeUnderStripeMin && paymentMethod === 'CREDIT_CARD') {
            setPaymentMethod('CASH')
        }
    }, [isFeeUnderStripeMin, paymentMethod])

    /**
     * 参加ボタンのハンドラ。
     * クレジットカード選択時: 参加登録 → PaymentIntent作成 → 決済モーダル表示
     * PayPay 選択時: 参加登録 → PayPay 支払い案内を表示
     * それ以外: 通常の参加登録のみ
     */
    const handleAttend = async () => {
        if (hasFee && paymentMethod === 'CREDIT_CARD') {
            // クレジットカードフロー: 参加登録 → PaymentIntent 作成 → モーダル表示
            try {
                await attendMutation.mutateAsync({ paymentMethod })
                const paymentData = await creditCardPaymentIntentMutation.mutateAsync()
                setCreditCardPaymentData(paymentData)
            } catch {
                // エラーは global toast で表示される
            }
        } else if (hasFee && paymentMethod === 'PAYPAY') {
            // PayPay フロー: 参加登録 → 支払い案内表示
            try {
                await attendMutation.mutateAsync({ paymentMethod })
                setShowPayPayGuide(true)
            } catch {
                // エラーは global toast で表示される
            }
        } else {
            try {
                await attendMutation.mutateAsync(hasFee ? { paymentMethod } : {})
                toast.success('参加しました')
            } catch {
                // エラーは global toast で表示される
            }
        }
    }

    /** クレジットカード決済成功ハンドラ */
    const handleCreditCardPaymentSuccess = () => {
        setCreditCardPaymentData(null)
        toast.success('決済が完了しました')
        // Webhook による支払いステータス更新を反映するため、少し遅延してクエリを再取得
        const invalidate = () => {
            queryClient.invalidateQueries({ queryKey: ['schedules', 'detail', scheduleId] })
            queryClient.invalidateQueries({ queryKey: ['participations', 'list', scheduleId] })
            queryClient.invalidateQueries({ queryKey: ['schedules', 'list', 'user'] })
        }
        invalidate()
        setTimeout(invalidate, 2000)
    }

    /** クレジットカード決済キャンセルハンドラ（常にモーダルを閉じるだけ） */
    const handleCreditCardPaymentCancel = () => {
        setCreditCardPaymentData(null)
    }

    /**
     * 繰り上げ参加者の支払い方法選択ハンドラ。
     * 参加済みだが paymentMethod 未設定の場合に使用。
     * 通常の参加フローと同じ後続処理（PayPay案内 / カード決済）を行う。
     */
    const handleSelectPaymentMethod = async () => {
        if (!myParticipationId) return
        try {
            await selectPaymentMethodMutation.mutateAsync({
                participationId: myParticipationId,
                paymentMethod,
            })
            if (hasFee && paymentMethod === 'CREDIT_CARD') {
                const paymentData = await creditCardPaymentIntentMutation.mutateAsync()
                setCreditCardPaymentData(paymentData)
            } else if (hasFee && paymentMethod === 'PAYPAY') {
                setShowPayPayGuide(true)
            } else {
                toast.success('支払い方法を設定しました')
            }
        } catch {
            // エラーは global toast で表示される
        }
    }

    // 成功メッセージを3秒後にリセット
    useEffect(() => {
        if (attendMutation.isSuccess) {
            const t = setTimeout(() => attendMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [attendMutation.isSuccess])

    useEffect(() => {
        if (joinWaitlistMutation.isSuccess) {
            const t = setTimeout(() => joinWaitlistMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [joinWaitlistMutation.isSuccess])

    useEffect(() => {
        if (cancelAttendanceMutation.isSuccess) {
            const t = setTimeout(() => cancelAttendanceMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [cancelAttendanceMutation.isSuccess])

    useEffect(() => {
        if (cancelWaitlistMutation.isSuccess) {
            const t = setTimeout(() => cancelWaitlistMutation.reset(), 3000)
            return () => clearTimeout(t)
        }
    }, [cancelWaitlistMutation.isSuccess])

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    // PayPay 支払い案内を表示すべきか（参加済み + PayPay支払い + 未支払い/報告済み）
    const showPayPayAttendingGuide = myStatus === 'attending'
        && myPaymentMethod === 'PAYPAY'
        && paypayId
        && myPaymentStatus !== 'CONFIRMED'

    return (
        <div className="space-y-3">
            {/* 4-4: PayPay 支払い済みキャンセル後の再参加時インフォメッセージ */}
            {myStatus === 'none' && hidePayPay && (
                <Alert variant="default" className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                        前回のお支払い（PayPay）については幹事にご確認ください。
                        返金状況に応じて支払い方法をお選びください。
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {/* ── 未参加 ── */}
                {myStatus === 'none' && !isFull && (
                    <>
                        {hasFee && (
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-36 h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethodOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                                            <span>{opt.label}</span>
                                            {opt.disabled && opt.reason && (
                                                <span className="text-[10px] text-gray-400 block leading-tight">{opt.reason}</span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <button
                            onClick={handleAttend}
                            disabled={attendMutation.isPending || creditCardPaymentIntentMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {(attendMutation.isPending || creditCardPaymentIntentMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                            参加する
                        </button>
                    </>
                )}

                {/* ── 満員 → キャンセル待ち登録 ── */}
                {myStatus === 'none' && isFull && (
                    <button
                        onClick={() => joinWaitlistMutation.mutate()}
                        disabled={joinWaitlistMutation.isPending}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {joinWaitlistMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                        キャンセル待ち
                    </button>
                )}

                {/* ── 参加済み → キャンセル ── */}
                {myStatus === 'attending' && (
                    <>
                        {/* 支払い方法未選択（繰り上げ時）→ 支払い方法選択UI */}
                        {hasFee && !myPaymentMethod && (
                            <>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="w-36 h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethodOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                                                <span>{opt.label}</span>
                                                {opt.disabled && opt.reason && (
                                                    <span className="text-[10px] text-gray-400 block leading-tight">{opt.reason}</span>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <button
                                    onClick={handleSelectPaymentMethod}
                                    disabled={selectPaymentMethodMutation.isPending || creditCardPaymentIntentMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {(selectPaymentMethodMutation.isPending || creditCardPaymentIntentMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                                    支払い方法を選択
                                </button>
                            </>
                        )}
                        {/* クレジットカード未払い/保留 → 支払うボタン */}
                        {hasFee && myPaymentMethod === 'CREDIT_CARD' && (myPaymentStatus === 'UNPAID' || myPaymentStatus === 'PENDING') && (
                            <button
                                onClick={async () => {
                                    try {
                                        const paymentData = await creditCardPaymentIntentMutation.mutateAsync()
                                        setCreditCardPaymentData(paymentData)
                                    } catch {
                                        // エラーは global toast で表示される
                                    }
                                }}
                                disabled={creditCardPaymentIntentMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {creditCardPaymentIntentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                                支払う
                            </button>
                        )}
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={cancelAttendanceMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                        >
                            {cancelAttendanceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                            キャンセル
                        </button>
                        {myPaymentMethod && (
                            <span className="text-xs text-gray-500">
                                （支払い方法：{PAYMENT_LABELS[myPaymentMethod] ?? myPaymentMethod}）
                            </span>
                        )}
                    </>
                )}

                {/* ── キャンセル待ち中 → WL取消 ── */}
                {myStatus === 'waitlisted' && (
                    <button
                        onClick={() => cancelWaitlistMutation.mutate()}
                        disabled={cancelWaitlistMutation.isPending}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
                    >
                        {cancelWaitlistMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                        キャンセル待ちを取り消す
                    </button>
                )}
            </div>

            {/* ③ PayPay 支払い案内モーダル（参加直後） */}
            <Dialog open={showPayPayGuide && !!paypayId} onOpenChange={(open) => { if (!open) setShowPayPayGuide(false) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-800">💰 PayPay でお支払い</DialogTitle>
                        <DialogDescription>以下の情報で PayPay アプリからお支払いください。</DialogDescription>
                    </DialogHeader>
                    {paypayId && (
                        <PayPayGuideContent
                            paypayId={paypayId}
                            amount={participationFee ?? 0}
                            copiedField={copiedField}
                            onCopy={copyToClipboard}
                            paymentStatus={myPaymentStatus ?? 'UNPAID'}
                            onReportPayment={myParticipationId ? () => {
                                setShowReportConfirm(true)
                            } : undefined}
                            isReporting={reportPaymentMutation.isPending}
                        />
                    )}
                    {/* #35: 後で支払うボタン */}
                    <button
                        type="button"
                        onClick={() => setShowPayPayGuide(false)}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                    >
                        後で支払う
                    </button>
                </DialogContent>
            </Dialog>

            {/* ③ PayPay 支払い案内モーダル（参加済みで PayPay 未確認時） */}
            {showPayPayAttendingGuide && !showPayPayGuide && (
                <PayPayGuideCard
                    paypayId={paypayId!}
                    amount={participationFee ?? 0}
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                    participationId={myParticipationId ?? undefined}
                    paymentStatus={myPaymentStatus ?? undefined}
                    onReportPayment={myParticipationId && myPaymentStatus === 'UNPAID' ? () => {
                        setShowReportConfirm(true)
                    } : undefined}
                    isReporting={reportPaymentMutation.isPending}
                />
            )}

            {/* フィードバック */}
            {attendMutation.isSuccess && !creditCardPaymentData && !showPayPayGuide && <p className="text-green-600 text-sm">参加登録しました ✓</p>}
            {joinWaitlistMutation.isSuccess && <p className="text-yellow-600 text-sm">キャンセル待ち登録しました ✓</p>}
            {cancelAttendanceMutation.isSuccess && <p className="text-gray-600 text-sm">参加を取り消しました</p>}
            {cancelWaitlistMutation.isSuccess && <p className="text-gray-600 text-sm">キャンセル待ちを取り消しました</p>}

            {/* クレジットカード決済モーダル */}
            {creditCardPaymentData && (
                <CreditCardPaymentModal
                    clientSecret={creditCardPaymentData.clientSecret}
                    totalAmount={creditCardPaymentData.totalAmount}
                    baseFee={creditCardPaymentData.baseFee}
                    platformFee={creditCardPaymentData.platformFee}
                    onSuccess={handleCreditCardPaymentSuccess}
                    onCancel={handleCreditCardPaymentCancel}
                />
            )}

            {/* キャンセル確認ダイアログ */}
            <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            参加をキャンセル
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div>
                                <span>キャンセルしますか？</span>
                                {myPaymentMethod === 'CREDIT_CARD' && myPaymentStatus === 'CONFIRMED' && (
                                    <div className="mt-3 space-y-2 text-left">
                                        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                                            <li>参加費は自動返金されます</li>
                                            <li>決済手数料は返金対象外です</li>
                                            <li>返金には通常 5〜10 営業日かかります</li>
                                        </ol>
                                        <p className="text-xs text-gray-500">※ 返金はカード会社経由で行われます</p>
                                    </div>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <button
                            onClick={() => setShowCancelConfirm(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        >
                            いいえ
                        </button>
                        <button
                            onClick={() => {
                                setShowCancelConfirm(false)
                                cancelAttendanceMutation.mutate()
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                            はい
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 支払い報告確認ダイアログ */}
            <Dialog open={showReportConfirm} onOpenChange={setShowReportConfirm}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>支払い報告</DialogTitle>
                        <DialogDescription>支払い報告しますか？</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <button
                            onClick={() => setShowReportConfirm(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        >
                            いいえ
                        </button>
                        <button
                            onClick={() => {
                                setShowReportConfirm(false)
                                setShowPayPayGuide(false)
                                if (myParticipationId) {
                                    reportPaymentMutation.mutate(myParticipationId)
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                            はい
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ─── PayPay 支払い案内カード ──────────────────────────

/** PayPay 支払い案内の共通コンテンツ（カード/モーダル両方で使用） */
function PayPayGuideContent({
    paypayId,
    amount,
    copiedField,
    onCopy,
    paymentStatus,
    onReportPayment,
    isReporting,
}: {
    paypayId: string
    amount: number
    copiedField: string | null
    onCopy: (text: string, field: string) => void
    paymentStatus?: string
    onReportPayment?: () => void
    isReporting?: boolean
}) {
    const [hasClickedPayLink, setHasClickedPayLink] = useState(false)

    return (
        <div className="space-y-3">
            {/* PayPay ID */}
            <div className="flex items-center gap-2 bg-white rounded px-3 py-2 border">
                <div className="flex-1">
                    <p className="text-[10px] text-gray-400">送金先 PayPay ID</p>
                    <p className="text-sm font-mono font-bold">{paypayId}</p>
                </div>
                <button
                    onClick={() => onCopy(paypayId, 'paypayId')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                    title="コピー"
                >
                    {copiedField === 'paypayId' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {/* 金額 */}
            <div className="flex items-center gap-2 bg-white rounded px-3 py-2 border">
                <div className="flex-1">
                    <p className="text-[10px] text-gray-400">お支払い金額</p>
                    <p className="text-sm font-bold">¥{amount.toLocaleString()}</p>
                </div>
                <button
                    onClick={() => onCopy(String(amount), 'amount')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                    title="コピー"
                >
                    {copiedField === 'amount' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {/* PayPay アプリを開く */}
            <a
                href="https://pay.paypay.ne.jp/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasClickedPayLink(true)}
                className="flex items-center justify-center gap-1 w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
                PayPay アプリで支払う
                <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* 支払い報告ボタン（支払いリンク押下後のみ活性化） */}
            {onReportPayment && paymentStatus === 'UNPAID' && (
                <button
                    onClick={onReportPayment}
                    disabled={isReporting || !hasClickedPayLink}
                    className={`w-full px-4 py-2 rounded-lg text-sm transition-colors ${isReporting || !hasClickedPayLink
                        ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                        }`}
                >
                    {isReporting && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
                    支払いを報告する
                </button>
            )}

            {/* 支払い報告済み表示 */}
            {paymentStatus === 'REPORTED' && (
                <p className="text-xs text-center text-amber-600 font-medium">✓ 支払い報告済み — 管理者の確認をお待ちください</p>
            )}
            {paymentStatus === 'CONFIRMED' && (
                <p className="text-xs text-center text-green-600 font-medium">✓ 支払い確認済み</p>
            )}

            <p className="text-[10px] text-gray-400 text-center">
                送金完了後「支払いを報告する」を押してください。管理者が確認します。
            </p>
        </div>
    )
}

function PayPayGuideCard({
    paypayId,
    amount,
    copiedField,
    onCopy,
    onClose,
    participationId,
    paymentStatus,
    onReportPayment,
    isReporting,
}: {
    paypayId: string
    amount: number
    copiedField: string | null
    onCopy: (text: string, field: string) => void
    onClose?: () => void
    participationId?: string
    paymentStatus?: string
    onReportPayment?: () => void
    isReporting?: boolean
}) {
    return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-red-800">💰 PayPay でお支払い</h4>
                {onClose && (
                    <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                )}
            </div>
            <PayPayGuideContent
                paypayId={paypayId}
                amount={amount}
                copiedField={copiedField}
                onCopy={onCopy}
                paymentStatus={paymentStatus}
                onReportPayment={onReportPayment}
                isReporting={isReporting}
            />
        </div>
    )
}
