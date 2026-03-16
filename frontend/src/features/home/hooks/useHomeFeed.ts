import { homeApi } from '@/features/home/api/homeApi'
import { announcementFeedKeys } from '@/shared/lib/queryKeys'
import type { AnnouncementFeedResponse } from '@/shared/types/api'
import { useInfiniteQuery } from '@tanstack/react-query'

const FEED_PAGE_SIZE = 20

export function useHomeFeed(activityFilter?: boolean) {
    return useInfiniteQuery<AnnouncementFeedResponse>({
        queryKey: [...announcementFeedKeys.all, { activityFilter }],
        queryFn: ({ pageParam }) =>
            homeApi.feed({
                cursor: pageParam as string | undefined,
                limit: FEED_PAGE_SIZE,
                activityFilter,
            }),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })
}
