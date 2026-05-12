import { http } from '@/shared/lib/apiClient'
import type { PlaceSearchResponse } from '@/shared/types/api'

export const placeApi = {
    search: (q: string, limit = 10) =>
        http<PlaceSearchResponse>('/v1/places/search', {
            query: { q, limit },
        }),
}
