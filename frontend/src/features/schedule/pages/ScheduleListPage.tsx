import { useCancelSchedule, useCreateSchedule, useSchedules } from '@/features/schedule/hooks/useScheduleQueries'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function ScheduleListPage() {
    const { activityId } = useParams<{ activityId: string }>()
    const navigate = useNavigate()
    const { data, isLoading } = useSchedules(activityId!)
    const createMutation = useCreateSchedule(activityId!)
    const cancelMutation = useCancelSchedule(activityId!)
    const [showForm, setShowForm] = useState(false)
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [capacity, setCapacity] = useState('')
    const [participationFee, setParticipationFee] = useState('')

    const handleCreate = async () => {
        if (!date || !startTime || !endTime) return
        const res = await createMutation.mutateAsync({
            date,
            startTime,
            endTime,
            capacity: capacity ? Number(capacity) : undefined,
            participationFee: participationFee ? Number(participationFee) : undefined,
        })
        setDate('')
        setStartTime('')
        setEndTime('')
        setCapacity('')
        setParticipationFee('')
        setShowForm(false)
        navigate(`/schedules/${res.scheduleId}`)
    }

    if (isLoading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>

    const schedules = data?.schedules ?? []

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">スケジュール</h1>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                    {showForm ? 'キャンセル' : '+ 新規作成'}
                </button>
            </div>

            {showForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-3">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <div className="flex gap-2">
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                    </div>
                    <input type="number" placeholder="定員（任意）" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <input type="number" placeholder="参加費（円・任意）" value={participationFee} onChange={(e) => setParticipationFee(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <button onClick={handleCreate} disabled={createMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                        作成
                    </button>
                </div>
            )}

            {schedules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">まだスケジュールがありません</p>
            ) : (
                <ul className="space-y-3">
                    {schedules.map((s) => (
                        <li key={s.id} className="p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
                            <Link to={`/schedules/${s.id}`} className="flex-1">
                                <p className="font-semibold">{s.date}</p>
                                <p className="text-sm text-gray-500">{s.startTime} - {s.endTime} {s.location && `📍 ${s.location}`}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {s.status}
                                    </span>
                                    {s.capacity != null && <span className="text-xs text-gray-500">定員: {s.capacity}</span>}
                                    {s.participationFee != null && s.participationFee > 0 && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">💰 ¥{s.participationFee.toLocaleString()}</span>
                                    )}
                                </div>
                            </Link>
                            {s.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => { if (confirm('キャンセルしますか？')) cancelMutation.mutate(s.id) }}
                                    className="text-red-500 text-sm hover:underline ml-4"
                                >
                                    キャンセル
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
