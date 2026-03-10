import { CalendarPlus } from 'lucide-react'

/**
 * AddToCalendarButton — スケジュールを外部カレンダーに追加（UBL-22）
 *
 * Google Calendar URL スキーム + iCal ダウンロードの2つの導線を提供
 */
export function AddToCalendarButton({
    title,
    date,
    startTime,
    endTime,
    location,
}: {
    title: string
    date: string // "YYYY-MM-DD"
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
    location?: string | null
}) {
    const [open, setOpen] = useState(false)

    const dtStart = formatGoogleDate(date, startTime)
    const dtEnd = formatGoogleDate(date, endTime)

    const googleUrl = buildGoogleCalendarUrl({
        title,
        dtStart,
        dtEnd,
        location: location ?? undefined,
    })

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
                <CalendarPlus className="w-3.5 h-3.5" />
                カレンダーに追加
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 py-1 w-48">
                    <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setOpen(false)}
                    >
                        📅 Google Calendar
                    </a>
                    <button
                        onClick={() => {
                            downloadIcal({ title, date, startTime, endTime, location })
                            setOpen(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                        📥 iCal (.ics) ダウンロード
                    </button>
                </div>
            )}
        </div>
    )
}

// ── ヘルパー ──

import { useState } from 'react'

function formatGoogleDate(date: string, time: string): string {
    // "YYYY-MM-DD" + "HH:mm" → "YYYYMMDDTHHMMSS"
    return date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00'
}

function buildGoogleCalendarUrl(params: {
    title: string
    dtStart: string
    dtEnd: string
    location?: string
}): string {
    const base = 'https://calendar.google.com/calendar/render'
    const sp = new URLSearchParams({
        action: 'TEMPLATE',
        text: params.title,
        dates: `${params.dtStart}/${params.dtEnd}`,
    })
    if (params.location) sp.set('location', params.location)
    return `${base}?${sp.toString()}`
}

function downloadIcal(params: {
    title: string
    date: string
    startTime: string
    endTime: string
    location?: string | null
}) {
    const dtStart = formatGoogleDate(params.date, params.startTime)
    const dtEnd = formatGoogleDate(params.date, params.endTime)
    const now = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d+/, '')

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//schedy//calendar//JP',
        'BEGIN:VEVENT',
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${params.title}`,
        params.location ? `LOCATION:${params.location}` : '',
        `DTSTAMP:${now}`,
        `UID:${crypto.randomUUID()}@schedy`,
        'END:VEVENT',
        'END:VCALENDAR',
    ]
        .filter(Boolean)
        .join('\r\n')

    const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'schedy-event.ics'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
