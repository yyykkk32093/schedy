import { http } from '@/shared/lib/apiClient';
import type { AnnouncementFeedResponse } from '@/shared/types/api';

export const homeApi = {
    feed: (params?: { cursor?: string; limit?: number; activityFilter?: boolean }) =>
        http<AnnouncementFeedResponse>('/v1/announcements/feed', {
            query: {
                cursor: params?.cursor,
                limit: params?.limit,
                ...(params?.activityFilter ? { activityFilter: 'true' } : {}),
            },
        }),
}
