import { ActivityForm, type ActivityFormValues } from '@/features/activity/components/ActivityForm'
import { useActivity, useUpdateActivity } from '@/features/activity/hooks/useActivityQueries'
import { useSchedules, useUpdateSchedule } from '@/features/schedule/hooks/useScheduleQueries'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * ActivityEditPage — アクティビティ更新画面
 *
 * /activities/:id/edit から遷移
 */
export function ActivityEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: activity, isLoading: isActivityLoading } = useActivity(id!)
    const { data: schedulesData, isLoading: isSchedulesLoading } = useSchedules(id!)
    const updateMutation = useUpdateActivity(id!, activity?.communityId ?? '')
    const firstSchedule = schedulesData?.schedules?.[0] ?? null
    const updateScheduleMutation = useUpdateSchedule(firstSchedule?.id ?? '', id!)

    const handleSubmit = async (values: ActivityFormValues) => {
        // Activity 本体の更新
        await updateMutation.mutateAsync({
            title: values.title,
            description: values.description || undefined,
            defaultLocation: values.defaultLocation || undefined,
            defaultAddress: values.defaultAddress || undefined,
            defaultStartTime: values.defaultStartTime || undefined,
            defaultEndTime: values.defaultEndTime || undefined,
            recurrenceRule: values.recurrenceRule,
            organizerUserId: values.organizerUserId || null,
        })
        // Schedule の更新（日付・定員・参加費・オンライン設定・会議URL）
        if (firstSchedule) {
            await updateScheduleMutation.mutateAsync({
                date: values.date || undefined,
                startTime: values.defaultStartTime || undefined,
                endTime: values.defaultEndTime || undefined,
                capacity: values.capacity,
                participationFee: values.participationFee,
                isOnline: values.isOnline,
                meetingUrl: values.meetingUrl,
            })
        }
        navigate(`/activities/${id}`, { replace: true })
    }

    if (isActivityLoading || isSchedulesLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!activity) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <p className="text-sm">アクティビティが見つかりません</p>
            </div>
        )
    }

    return (
        <ActivityForm
            communityId={activity.communityId}
            initialValues={{
                title: activity.title,
                description: activity.description ?? '',
                defaultLocation: activity.defaultLocation ?? '',
                defaultAddress: activity.defaultAddress ?? '',
                defaultStartTime: activity.defaultStartTime ?? '',
                defaultEndTime: activity.defaultEndTime ?? '',
                recurrenceRule: activity.recurrenceRule ?? null,
                organizerUserId: activity.organizerUserId ?? '',
                date: firstSchedule?.date ?? '',
                capacity: firstSchedule?.capacity ?? null,
                participationFee: firstSchedule?.participationFee ?? null,
                isOnline: firstSchedule?.isOnline ?? false,
                meetingUrl: firstSchedule?.meetingUrl ?? null,
            }}
            submitLabel="保存"
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending || updateScheduleMutation.isPending}
            allowPastDate
        />
    )
}
