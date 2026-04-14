import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import type { IWaitlistEntryRepository } from '@/domains/activity/schedule/waitlist/domain/repository/IWaitlistEntryRepository.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { ScheduleNotFoundError } from '../error/ScheduleNotFoundError.js'

export type MyScheduleStatus = 'none' | 'attending' | 'waitlisted'

export class FindScheduleUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly activityRepository: IActivityRepository,
        private readonly participationRepository: IParticipationRepository,
        private readonly waitlistEntryRepository: IWaitlistEntryRepository,
        private readonly paymentRepository: IPaymentRepository,
        private readonly communityRepository: ICommunityRepository,
    ) { }

    async execute(input: { scheduleId: string; userId?: string }): Promise<{
        id: string; activityId: string; communityId: string;
        date: string; startTime: string; endTime: string;
        location: string | null; note: string | null; status: string;
        capacity: number | null; participationFee: number | null;
        visitorFee: number | null;
        isOnline: boolean; meetingUrl: string | null;
        myStatus: MyScheduleStatus; myParticipationId: string | null;
        myPaymentMethod: string | null; myPaymentStatus: string | null;
        attendingCount: number; waitlistCount: number;
        enabledPaymentMethods: string[]; paypayId: string | null;
    }> {
        const schedule = await this.scheduleRepository.findById(input.scheduleId)
        if (!schedule) throw new ScheduleNotFoundError()

        const scheduleId = schedule.getId().getValue()
        const activity = await this.activityRepository.findById(schedule.getActivityId().getValue())
        const communityId = activity?.getCommunityId().getValue() ?? ''
        const community = communityId ? await this.communityRepository.findById(communityId) : null

        const [attendingCount, waitlistCount, participation, waitlistEntry, payment] = await Promise.all([
            this.participationRepository.count(scheduleId),
            this.waitlistEntryRepository.count(scheduleId),
            input.userId
                ? this.participationRepository.findByScheduleAndUser(scheduleId, input.userId)
                : Promise.resolve(null),
            input.userId
                ? this.waitlistEntryRepository.findByScheduleAndUser(scheduleId, input.userId)
                : Promise.resolve(null),
            input.userId
                ? this.paymentRepository.findLatestByScheduleAndUser(scheduleId, input.userId)
                : Promise.resolve(null),
        ])

        let myStatus: MyScheduleStatus = 'none'
        if (participation != null) myStatus = 'attending'
        else if (waitlistEntry != null) myStatus = 'waitlisted'

        return {
            id: scheduleId,
            activityId: schedule.getActivityId().getValue(),
            communityId,
            date: schedule.getDate().toISOString().split('T')[0],
            startTime: schedule.getStartTime().getValue(),
            endTime: schedule.getEndTime().getValue(),
            location: schedule.getLocation(),
            note: schedule.getNote(),
            status: schedule.getStatus().getValue(),
            capacity: schedule.getCapacity().getValue(),
            participationFee: schedule.getParticipationFee().amount,
            visitorFee: schedule.getVisitorFee()?.amount ?? null,
            isOnline: schedule.getIsOnline(),
            meetingUrl: schedule.getMeetingUrl(),
            myStatus,
            myParticipationId: participation?.getId() ?? null,
            myPaymentMethod: payment?.getPaymentMethod()?.getValue() ?? null,
            myPaymentStatus: payment?.getPaymentStatus().getValue() ?? null,
            attendingCount,
            waitlistCount,
            enabledPaymentMethods: community?.getEnabledPaymentMethods() ?? ['CASH'],
            paypayId: community?.getPayPayId() ?? null,
        }
    }
}
