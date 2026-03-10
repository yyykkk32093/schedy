import { ActivityForm, type ActivityFormValues } from '@/features/activity/components/ActivityForm'
import { useActivity, useUpdateActivity } from '@/features/activity/hooks/useActivityQueries'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * ActivityEditPage — アクティビティ更新画面
 *
 * /activities/:id/edit から遷移
 */
export function ActivityEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: activity, isLoading } = useActivity(id!)
    const updateMutation = useUpdateActivity(id!, activity?.communityId ?? '')

    const handleSubmit = async (values: ActivityFormValues) => {
        await updateMutation.mutateAsync({
            title: values.title,
            description: values.description || undefined,
            defaultLocation: values.defaultLocation || undefined,
            defaultStartTime: values.defaultStartTime || undefined,
            defaultEndTime: values.defaultEndTime || undefined,
            recurrenceRule: values.recurrenceRule,
        })
        navigate(`/activities/${id}`)
    }

    if (isLoading) {
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
                defaultStartTime: activity.defaultStartTime ?? '',
                defaultEndTime: activity.defaultEndTime ?? '',
                recurrenceRule: activity.recurrenceRule ?? null,
            }}
            submitLabel="保存"
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
        />
    )
}
