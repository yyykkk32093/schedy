/**
 * API レスポンス型定義
 * バックエンドの DTO に対応するフロントエンド側の型
 */

// ============================================================
// Auth
// ============================================================

/** POST /v1/auth/password — リクエスト */
export interface PasswordLoginRequest {
    email: string
    password: string
}

/** POST /v1/auth/password — レスポンス */
export interface PasswordLoginResponse {
    userId: string
    accessToken?: string  // httpOnly Cookie方式では省略されうる
}

/** POST /v1/auth/oauth/:provider — リクエスト */
export interface OAuthLoginRequest {
    code: string
    redirectUri?: string
}

/** POST /v1/auth/oauth/:provider — レスポンス */
export interface OAuthLoginResponse {
    userId: string
    accessToken?: string
}

export type OAuthProvider = 'google' | 'line' | 'apple'

/** POST /v1/auth/logout — レスポンス */
export interface LogoutResponse {
    message: string
}

/** GET /v1/auth/me — レスポンス */
export interface AuthMeResponse {
    userId: string
    plan: 'FREE' | 'SUBSCRIBER' | 'LIFETIME'
    displayName: string | null
    email: string
    avatarUrl: string | null
    features: Record<string, boolean>
    limits: Record<string, number>
}

// ============================================================
// User
// ============================================================

/** POST /v1/users — リクエスト */
export interface SignUpRequest {
    email: string
    password: string
    displayName?: string
}

/** POST /v1/users — レスポンス */
export interface SignUpResponse {
    userId: string
}

// ============================================================
// Error — ApiError は src/shared/lib/apiClient.ts で定義・export
// HttpError.api の型として統一。ここでは再定義しない
// ============================================================

// ============================================================
// Community
// ============================================================

/** POST /v1/communities — リクエスト */
export interface CreateCommunityRequest {
    name: string
    description?: string
    communityTypeId?: string
    joinMethod?: 'FREE_JOIN' | 'APPROVAL' | 'INVITATION'
    isPublic?: boolean
    maxMembers?: number
    mainActivityArea?: string
    activityFrequency?: string
    nearestStation?: string
    targetGender?: string
    ageRange?: string
    categoryIds?: string[]
    participationLevelIds?: string[]
    activityDays?: string[]
    tags?: string[]
}

/** POST /v1/communities — レスポンス */
export interface CreateCommunityResponse {
    communityId: string
}

/** GET /v1/communities — レスポンス */
export interface ListCommunitiesResponse {
    communities: CommunityListItem[]
}

export interface CommunityListItem {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    coverUrl: string | null
    grade: string
    role: string
    createdBy: string
    communityTypeId: string | null
    joinMethod: string
    isPublic: boolean
    maxMembers: number | null
    mainActivityArea: string | null
    latestAnnouncementTitle: string | null
    latestAnnouncementAt: string | null
}

/** GET /v1/communities/:id — レスポンス */
export interface CommunityDetail {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    coverUrl: string | null
    grade: string
    createdBy: string
    communityTypeId: string | null
    joinMethod: string
    isPublic: boolean
    maxMembers: number | null
    mainActivityArea: string | null
    activityFrequency: string | null
    nearestStation: string | null
    targetGender: string | null
    ageRange: string | null
    categories: Array<{ id: string; name: string; nameEn: string }>
    participationLevels: Array<{ id: string; name: string; nameEn: string }>
    activityDays: string[]
    tags: string[]
    memberCount: number
    payPayId?: string | null
    enabledPaymentMethods?: string[]
}

/** PATCH /v1/communities/:id — リクエスト */
export interface UpdateCommunityRequest {
    name?: string
    description?: string
    logoUrl?: string | null
    coverUrl?: string | null
    payPayId?: string | null
    enabledPaymentMethods?: string[]
}

/** POST /v1/communities/:parentId/children — リクエスト */
export interface CreateSubCommunityRequest {
    name: string
    description?: string
}

// ============================================================
// Membership
// ============================================================

export interface Member {
    id: string
    userId: string
    role: string
    joinedAt: string
    displayName: string | null
    avatarUrl: string | null
}

export interface ListMembersResponse {
    members: Member[]
}

// ============================================================
// Community Audit Log (UBL-10)
// ============================================================

export interface AuditLogEntry {
    id: string
    actorUserId: string
    action: string
    field: string | null
    before: string | null
    after: string | null
    summary: string
    createdAt: string
}

export interface ListAuditLogsResponse {
    logs: AuditLogEntry[]
}

// ============================================================
// Invite Token (UBL-11)
// ============================================================

export interface GenerateInviteTokenResponse {
    token: string
    expiresAt: string
}

export interface AcceptInviteResponse {
    communityId: string
    membershipId: string
}

// ============================================================
// User Profile (UBL-32)
// ============================================================

export interface UserProfile {
    id: string
    displayName: string | null
    email: string | null
    phone: string | null
    biography: string | null
    avatarUrl: string | null
    plan: string
}

export interface UpdateUserProfileRequest {
    displayName?: string | null
    avatarUrl?: string | null
    biography?: string | null
}

export interface AddMemberRequest {
    userId: string
}

export interface ChangeMemberRoleRequest {
    role: string
}

// ============================================================
// Master Data
// ============================================================

export interface MasterItem {
    id: string
    name: string
    nameEn: string
    sortOrder: number
}

export interface CommunityMastersResponse {
    communityTypes: MasterItem[]
    categories: MasterItem[]
    participationLevels: MasterItem[]
}

// ============================================================
// Community — Search & Join (Phase 2.5)
// ============================================================

/** GET /v1/communities/search — クエリパラメータ */
export interface SearchCommunitiesParams {
    keyword?: string
    categoryIds?: string[]
    levelIds?: string[]
    area?: string
    days?: string[]
    limit?: number
    offset?: number
}

/** GET /v1/communities/search — レスポンス */
export interface SearchCommunitiesResponse {
    communities: PublicCommunitySearchItem[]
    total: number
}

export interface PublicCommunitySearchItem {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    mainActivityArea: string | null
    joinMethod: string
    memberCount: number
    categories: Array<{ id: string; name: string }>
    participationLevels: Array<{ id: string; name: string }>
}

/** POST /v1/communities/:id/join — レスポンス */
export interface JoinCommunityResponse {
    membershipId: string
}

/** POST /v1/communities/:id/join-request — リクエスト */
export interface JoinRequestBody {
    message?: string
}

/** POST /v1/communities/:id/join-request — レスポンス */
export interface JoinRequestResponse {
    joinRequestId: string
}

// ============================================================
// Activity
// ============================================================

export interface CreateActivityRequest {
    title: string
    description?: string | null
    defaultLocation?: string | null
    defaultStartTime?: string | null
    defaultEndTime?: string | null
    recurrenceRule?: string | null
    date?: string | null
}

export interface CreateActivityResponse {
    activityId: string
}

export interface ListActivitiesResponse {
    activities: ActivityListItem[]
}

export interface ActivityListItem {
    id: string
    communityId: string
    title: string
    description: string | null
    defaultLocation: string | null
    defaultStartTime: string | null
    defaultEndTime: string | null
    createdBy: string
    createdByDisplayName: string | null
    upcomingSchedules: Array<{
        date: string
        startTime: string
        endTime: string
    }>
}

export interface ActivityDetail extends ActivityListItem {
    recurrenceRule: string | null
}

export interface UpdateActivityRequest {
    title?: string
    description?: string | null
    defaultLocation?: string | null
    defaultStartTime?: string | null
    defaultEndTime?: string | null
    recurrenceRule?: string | null
}

// ============================================================
// Schedule
// ============================================================

export interface CreateScheduleRequest {
    date: string
    startTime: string
    endTime: string
    location?: string | null
    note?: string | null
    capacity?: number | null
    participationFee?: number | null
}

export interface CreateScheduleResponse {
    scheduleId: string
}

export interface ListSchedulesResponse {
    schedules: ScheduleListItem[]
}

export interface ScheduleListItem {
    id: string
    activityId: string
    date: string
    startTime: string
    endTime: string
    location: string | null
    note: string | null
    status: string
    capacity: number | null
    participationFee: number | null
}

export interface UpdateScheduleRequest {
    date?: string
    startTime?: string
    endTime?: string
    location?: string | null
    note?: string | null
    capacity?: number | null
    participationFee?: number | null
}

// ============================================================
// User Schedule (横断取得)
// ============================================================

export interface UserScheduleItem {
    scheduleId: string
    date: string
    startTime: string
    endTime: string
    location: string | null
    status: string
    participationFee: number | null
    activityId: string
    activityTitle: string
    communityId: string
    communityName: string
}

export interface ListUserSchedulesResponse {
    schedules: UserScheduleItem[]
}

// ============================================================
// Participation / Waitlist
// ============================================================

export interface AttendScheduleRequest {
    isVisitor?: boolean
    paymentMethod?: string | null
}

export interface AttendScheduleResponse {
    participationId: string
}

export interface JoinWaitlistResponse {
    waitlistEntryId: string
}

export interface ParticipantItem {
    id: string
    userId: string
    displayName: string | null
    status: string
    isVisitor: boolean
    respondedAt: string
    paymentMethod: string | null
    paymentStatus: string | null
}

export interface ListParticipantsResponse {
    participants: ParticipantItem[]
}

// ============================================================
// Announcement
// ============================================================

export interface CreateAnnouncementRequest {
    title: string
    content: string
    attachments?: Array<{
        fileUrl: string
        fileName: string
        mimeType: string
        fileSize: number
    }>
}

export interface CreateAnnouncementResponse {
    announcementId: string
}

export interface ListAnnouncementsResponse {
    announcements: AnnouncementListItem[]
}

export interface AnnouncementListItem {
    id: string
    communityId: string
    authorId: string
    authorName: string | null
    authorAvatarUrl: string | null
    communityName: string
    communityLogoUrl: string | null
    title: string
    content: string
    isRead: boolean
    createdAt: string
    likeCount: number
    commentCount: number
    isLiked: boolean
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
}

export interface AnnouncementDetail {
    id: string
    communityId: string
    authorId: string
    title: string
    content: string
    createdAt: string
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
}

// ============================================================
// Announcement Feed (Home)
// ============================================================

export interface AnnouncementFeedItem {
    id: string
    communityId: string
    authorId: string
    authorName: string | null
    authorAvatarUrl: string | null
    communityName: string
    communityLogoUrl: string | null
    title: string
    content: string
    isRead: boolean
    createdAt: string
    likeCount: number
    commentCount: number
    isLiked: boolean
    attachments: Array<{ id: string; fileUrl: string; mimeType: string }>
}

export interface AnnouncementFeedResponse {
    items: AnnouncementFeedItem[]
    nextCursor: string | null
}

// ============================================================
// Chat Channel / Message
// ============================================================

export interface ChatChannel {
    channelId: string
    type: 'COMMUNITY' | 'ACTIVITY' | 'DM'
    communityId?: string | null
    activityId?: string | null
    createdAt: string
}

export interface MessageAttachment {
    id: string
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
}

export interface MessageReactionSummary {
    stampId: string
    count: number
    reacted: boolean
}

export interface MessageItem {
    id: string
    channelId: string
    senderId: string
    content: string
    mentions: unknown
    parentMessageId: string | null
    attachments: MessageAttachment[]
    reactions: MessageReactionSummary[]
    replyCount: number
    createdAt: string
}

export interface ListMessagesResponse {
    messages: MessageItem[]
    nextCursor: string | null
}

export interface SearchMessagesResponse {
    messages: MessageItem[]
    nextCursor: string | null
    query: string
}

export interface SendMessageRequest {
    content: string
    mentions?: string[]
    parentMessageId?: string
}

export interface SendMessageResponse {
    messageId: string
}

// ============================================================
// My Channels (GET /v1/channels)
// ============================================================

export interface MyChannelLastMessage {
    id: string
    senderId: string
    content: string
    createdAt: string
}

export interface MyCommunityChannel {
    channelId: string
    type: 'COMMUNITY'
    name: string
    avatarUrl: string | null
    communityId: string | null
    lastMessage: MyChannelLastMessage | null
}

export interface MyActivityChannel {
    channelId: string
    type: 'ACTIVITY'
    name: string
    subtitle: string
    activityId: string | null
    lastMessage: MyChannelLastMessage | null
}

export interface MyDMChannel {
    channelId: string
    type: 'DM'
    participants: string[]
    lastMessage: MyChannelLastMessage | null
}

export interface MyChannelsResponse {
    community: MyCommunityChannel[]
    activity: MyActivityChannel[]
    dm: MyDMChannel[]
}

// ============================================================
// DM
// ============================================================

export interface DMChannelItem {
    channelId: string
    participants: string[]
    lastMessage: {
        id: string
        senderId: string
        content: string
        createdAt: string
    } | null
}

export interface ListDMChannelsResponse {
    channels: DMChannelItem[]
}

export interface CreateDMRequest {
    participantIds: string[]
}

export interface CreateDMResponse {
    channelId: string
    type: 'DM'
    participants: string[]
}

// ============================================================
// Stamp
// ============================================================

export interface StampItem {
    id: string
    createdByUserId: string
    name: string
    imageUrl: string
    createdAt: string
}

export interface ListStampsResponse {
    stamps: StampItem[]
}

export interface CreateStampRequest {
    name: string
    imageUrl: string
}

// ============================================================
// Notification
// ============================================================

export interface NotificationItem {
    id: string
    type: string
    title: string
    body: string | null
    referenceId: string | null
    referenceType: string | null
    isRead: boolean
    createdAt: string
}

export interface ListNotificationsResponse {
    notifications: NotificationItem[]
    nextCursor: string | null
}

export interface UnreadCountResponse {
    unreadCount: number
}

// ============================================================
// Stripe Connect
// ============================================================

// ============================================================
// UBL-1: Announcement Like
// ============================================================

export interface ToggleLikeResponse {
    liked: boolean
    likeCount: number
}

// ============================================================
// UBL-2: Announcement Comment
// ============================================================

export interface CreateCommentRequest {
    content: string
}

export interface CreateCommentResponse {
    commentId: string
}

export interface CommentItem {
    id: string
    announcementId: string
    userId: string
    userName: string | null
    userAvatarUrl: string | null
    content: string
    createdAt: string
}

export interface ListCommentsResponse {
    comments: CommentItem[]
    nextCursor: string | null
}

// ============================================================
// UBL-4: Announcement Search
// ============================================================

export interface SearchAnnouncementsResponse {
    items: AnnouncementFeedItem[]
}

// ============================================================
// UBL-6: Album
// ============================================================

export interface CreateAlbumRequest {
    title: string
    description?: string
}

export interface CreateAlbumResponse {
    albumId: string
}

export interface AlbumItem {
    id: string
    communityId: string
    title: string
    description: string | null
    createdBy: string
    createdAt: string
    photoCount: number
    coverUrl: string | null
}

export interface ListAlbumsResponse {
    albums: AlbumItem[]
}

export interface AddAlbumPhotoRequest {
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
}

export interface AddAlbumPhotoResponse {
    photoId: string
}

export interface AlbumPhotoItem {
    id: string
    albumId: string
    fileUrl: string
    fileName: string
    mimeType: string
    fileSize: number
    uploadedBy: string
    createdAt: string
}

export interface ListAlbumPhotosResponse {
    photos: AlbumPhotoItem[]
}

// ============================================================
// Analytics — Phase 4 (UBL-17〜22)
// ============================================================

/** UBL-17: GET /v1/communities/:communityId/analytics/stats */
export interface ActivityStatsItem {
    activityId: string
    activityTitle: string
    totalSchedules: number
    totalAttending: number
    totalCancelled: number
    attendanceRate: number
}

export interface MonthlyStatsItem {
    month: string
    totalSchedules: number
    totalAttending: number
    attendanceRate: number
}

export interface CommunityStatsResponse {
    communityId: string
    totalMembers: number
    totalActivities: number
    totalSchedules: number
    totalParticipations: number
    overallAttendanceRate: number
    byActivity: ActivityStatsItem[]
    byMonth: MonthlyStatsItem[]
}

/** UBL-19: GET /v1/communities/:communityId/analytics/trend */
export interface TrendPointItem {
    month: string
    uniqueParticipants: number
    totalAttendances: number
    newParticipants: number
}

export interface ParticipationTrendResponse {
    communityId: string
    trend: TrendPointItem[]
}

/** UBL-18: GET /v1/communities/:communityId/analytics/absences */
export interface AbsenceItem {
    participationId: string
    scheduleId: string
    activityTitle: string
    scheduleDate: string
    userId: string
    displayName: string | null
    cancelledAt: string
    isSameDayCancel: boolean
}

export interface AbsenceSummaryData {
    totalCancellations: number
    sameDayCancellations: number
    frequentCancellers: Array<{
        userId: string
        displayName: string | null
        cancelCount: number
        sameDayCancelCount: number
    }>
}

export interface AbsenceReportResponse {
    communityId: string
    summary: AbsenceSummaryData
    items: AbsenceItem[]
}

