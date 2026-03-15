import { ScheduleNotFoundError } from '@/application/schedule/error/ScheduleNotFoundError.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { calculatePaymentAmount } from '@/domains/activity/schedule/participation/domain/service/calculatePaymentAmount.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { IStripeService } from '@/integration/stripe/IStripeService.js'
import { ParticipationError } from '../error/ParticipationError.js'

export class CreateStripePaymentIntentUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
        private readonly paymentRepository: IPaymentRepository,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly activityRepository: IActivityRepository,
        private readonly communityRepository: ICommunityRepository,
        private readonly stripeService: IStripeService,
    ) { }

    async execute(input: {
        scheduleId: string
        userId: string
    }): Promise<{
        clientSecret: string
        paymentIntentId: string
        totalAmount: number
        platformFee: number
        baseFee: number
    }> {
        // 参加確認
        const participation = await this.participationRepository.findByScheduleAndUser(
            input.scheduleId, input.userId,
        )
        if (!participation) {
            throw new ParticipationError('参加情報が見つかりません', 'PARTICIPATION_NOT_FOUND')
        }

        // Payment から支払い方法・既存 PI を確認
        const payment = await this.paymentRepository.findLatestByScheduleAndUser(
            input.scheduleId, input.userId,
        )
        if (!payment) {
            throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
        }
        if (!payment.getPaymentMethod().isStripe()) {
            throw new ParticipationError('Stripe 支払方法が指定されていません', 'INVALID_PAYMENT_METHOD')
        }
        if (payment.getStripePaymentIntentId()) {
            throw new ParticipationError('PaymentIntent は既に作成済みです', 'PAYMENT_INTENT_ALREADY_EXISTS')
        }

        const schedule = await this.scheduleRepository.findById(input.scheduleId)
        if (!schedule) throw new ScheduleNotFoundError()

        const baseFee = schedule.getParticipationFee()
        if (!baseFee || baseFee <= 0) {
            throw new ParticipationError('参加費が設定されていません', 'NO_PARTICIPATION_FEE')
        }

        const activity = await this.activityRepository.findById(
            schedule.getActivityId().getValue(),
        )
        if (!activity) {
            throw new ParticipationError('アクティビティが見つかりません', 'ACTIVITY_NOT_FOUND')
        }

        const community = await this.communityRepository.findById(
            activity.getCommunityId().getValue(),
        )
        if (!community) {
            throw new ParticipationError('コミュニティが見つかりません', 'COMMUNITY_NOT_FOUND')
        }

        const stripeAccountId = community.getStripeAccountId()
        if (!stripeAccountId) {
            throw new ParticipationError(
                'コミュニティに Stripe アカウントが未設定です',
                'STRIPE_ACCOUNT_NOT_CONFIGURED',
            )
        }

        const { totalAmount, platformFee, transferAmount } = calculatePaymentAmount(baseFee)

        const { clientSecret, paymentIntentId } = await this.stripeService.createPaymentIntent({
            amount: totalAmount,
            currency: 'jpy',
            destinationAccountId: stripeAccountId,
            transferAmount,
            metadata: {
                scheduleId: input.scheduleId,
                userId: input.userId,
                baseFee: String(baseFee),
                platformFee: String(platformFee),
            },
        })

        // Payment に PaymentIntentId を記録
        payment.setStripePaymentIntentId(paymentIntentId)
        await this.paymentRepository.update(payment)

        return {
            clientSecret,
            paymentIntentId,
            totalAmount,
            platformFee,
            baseFee,
        }
    }
}
