/**
 * レスポンス Zod スキーマ
 * AUTO-GENERATED — DO NOT EDIT MANUALLY
 * Run `pnpm generate:response-schemas` to regenerate
 */
import { z } from 'zod/v4'

export const PasswordLoginRequestSchema = z.object({
    email: z.string(),
    password: z.string(),
})
export type PasswordLoginRequest = z.infer<typeof PasswordLoginRequestSchema>

export const PasswordLoginResponseSchema = z.object({
    userId: z.string(),
    accessToken: z.string().optional(),
})
export type PasswordLoginResponse = z.infer<typeof PasswordLoginResponseSchema>

export const OAuthLoginRequestSchema = z.object({
    code: z.string(),
    redirectUri: z.string().optional(),
})
export type OAuthLoginRequest = z.infer<typeof OAuthLoginRequestSchema>

export const OAuthLoginResponseSchema = z.object({
    userId: z.string(),
    accessToken: z.string().optional(),
})
export type OAuthLoginResponse = z.infer<typeof OAuthLoginResponseSchema>

export const LogoutResponseSchema = z.object({
    message: z.string(),
})
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>

export const AuthMeResponseSchema = z.object({
    userId: z.string(),
    plan: z.enum(['FREE', 'LITE', 'PRO', 'LIFETIME']),
    displayName: z.string().nullable(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    systemRole: z.enum(['USER', 'OPERATOR', 'SUPER_ADMIN']),
    features: z.record(z.string(), z.boolean()),
    limits: z.record(z.string(), z.number()),
})
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>

export const SignUpRequestSchema = z.object({
    email: z.string(),
    password: z.string(),
    displayName: z.string().optional(),
})
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>

export const SignUpResponseSchema = z.object({
    userId: z.string(),
})
export type SignUpResponse = z.infer<typeof SignUpResponseSchema>

export const CreateCommunityRequestSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']).optional(),
    isPublic: z.boolean().optional(),
    maxMembers: z.number().optional(),
    activityFrequency: z.string().optional(),
    targetGender: z.array(z.string()).optional(),
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    categoryIds: z.array(z.string()),
    recommendedLevelMin: z.number().optional(),
    recommendedLevelMax: z.number().optional(),
    activityDays: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    locations: z.array(z.object({
        type: z.enum(['MAIN', 'SUB']),
        area: z.string(),
        station: z.string().optional(),
    })).optional(),
})
export type CreateCommunityRequest = z.infer<typeof CreateCommunityRequestSchema>

export const CreateCommunityResponseSchema = z.object({
    communityId: z.string(),
})
export type CreateCommunityResponse = z.infer<typeof CreateCommunityResponseSchema>

export const CommunityListItemSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    coverUrl: z.string().nullable(),
    grade: z.string(),
    role: z.string(),
    createdBy: z.string(),
    joinMethod: z.string(),
    isPublic: z.boolean(),
    maxMembers: z.number().nullable(),
    latestAnnouncementTitle: z.string().nullable(),
    latestAnnouncementAt: z.string().nullable(),
    bookmarked: z.boolean(),
})
export type CommunityListItem = z.infer<typeof CommunityListItemSchema>

export const ListCommunitiesResponseSchema = z.object({
    communities: z.array(CommunityListItemSchema),
})
export type ListCommunitiesResponse = z.infer<typeof ListCommunitiesResponseSchema>

export const CommunityDetailSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    coverUrl: z.string().nullable(),
    grade: z.string(),
    createdBy: z.string(),
    joinMethod: z.string(),
    isPublic: z.boolean(),
    maxMembers: z.number().nullable(),
    activityFrequency: z.string().nullable(),
    targetGender: z.array(z.string()),
    ageMin: z.number().nullable(),
    ageMax: z.number().nullable(),
    recommendedLevelMin: z.number().nullable(),
    recommendedLevelMax: z.number().nullable(),
    categories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        nameEn: z.string(),
    })),
    participationLevels: z.array(z.object({
        id: z.string(),
        name: z.string(),
        nameEn: z.string(),
    })),
    activityDays: z.array(z.string()),
    tags: z.array(z.string()),
    memberCount: z.number(),
    payPayId: z.string().nullable().optional(),
    enabledPaymentMethods: z.array(z.string()).optional(),
    locations: z.array(z.object({
        id: z.string(),
        type: z.enum(['MAIN', 'SUB']),
        area: z.string(),
        station: z.string().nullable(),
        sortOrder: z.number(),
    })).optional(),
})
export type CommunityDetail = z.infer<typeof CommunityDetailSchema>

export const UpdateCommunityRequestSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    logoUrl: z.string().nullable().optional(),
    coverUrl: z.string().nullable().optional(),
    payPayId: z.string().nullable().optional(),
    enabledPaymentMethods: z.array(z.string()).optional(),
    joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']).optional(),
    isPublic: z.boolean().optional(),
    activityFrequency: z.string().nullable().optional(),
    targetGender: z.array(z.string()).optional(),
    ageMin: z.number().nullable().optional(),
    ageMax: z.number().nullable().optional(),
    categoryIds: z.array(z.string()).optional(),
    recommendedLevelMin: z.number().nullable().optional(),
    recommendedLevelMax: z.number().nullable().optional(),
    tags: z.array(z.string()).optional(),
    locations: z.array(z.object({
        type: z.enum(['MAIN', 'SUB']),
        area: z.string(),
        station: z.string().optional(),
    })).optional(),
})
export type UpdateCommunityRequest = z.infer<typeof UpdateCommunityRequestSchema>

export const CreateSubCommunityRequestSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    inheritSettings: z.boolean().optional(),
    memberInheritance: z.enum(['ALL', 'SELECT', 'OWNER_ONLY', 'ADMIN_AND_ABOVE']).optional(),
    selectedMemberIds: z.array(z.string()).optional(),
    joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']).optional(),
    isPublic: z.boolean().optional(),
    maxMembers: z.number().optional(),
    targetGender: z.array(z.string()).optional(),
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    activityFrequency: z.string().optional(),
    activityDays: z.array(z.string()).optional(),
    recommendedLevelMin: z.number().optional(),
    recommendedLevelMax: z.number().optional(),
    categoryIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
})
export type CreateSubCommunityRequest = z.infer<typeof CreateSubCommunityRequestSchema>

export const SubCommunityListItemSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    memberCount: z.number(),
    latestAnnouncementTitle: z.string().nullable(),
    latestAnnouncementAt: z.string().nullable(),
    bookmarked: z.boolean(),
})
export type SubCommunityListItem = z.infer<typeof SubCommunityListItemSchema>

export const ListSubCommunitiesResponseSchema = z.object({
    children: z.array(SubCommunityListItemSchema),
})
export type ListSubCommunitiesResponse = z.infer<typeof ListSubCommunitiesResponseSchema>

export const MemberSchema = z.object({
    id: z.string(),
    userId: z.string(),
    role: z.string(),
    joinedAt: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    level: z.number().nullable(),
})
export type Member = z.infer<typeof MemberSchema>

export const ListMembersResponseSchema = z.object({
    members: z.array(MemberSchema),
})
export type ListMembersResponse = z.infer<typeof ListMembersResponseSchema>

export const AuditLogEntrySchema = z.object({
    id: z.string(),
    actorUserId: z.string(),
    actorDisplayName: z.string().nullable(),
    action: z.string(),
    field: z.string().nullable(),
    before: z.string().nullable(),
    after: z.string().nullable(),
    summary: z.string(),
    createdAt: z.string(),
})
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>

export const ListAuditLogsResponseSchema = z.object({
    logs: z.array(AuditLogEntrySchema),
})
export type ListAuditLogsResponse = z.infer<typeof ListAuditLogsResponseSchema>

export const GenerateInviteTokenResponseSchema = z.object({
    token: z.string(),
    expiresAt: z.string(),
})
export type GenerateInviteTokenResponse = z.infer<typeof GenerateInviteTokenResponseSchema>

export const AcceptInviteResponseSchema = z.object({
    communityId: z.string(),
    membershipId: z.string(),
})
export type AcceptInviteResponse = z.infer<typeof AcceptInviteResponseSchema>

export const UserProfileSchema = z.object({
    id: z.string(),
    displayName: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    biography: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    plan: z.string(),
})
export type UserProfile = z.infer<typeof UserProfileSchema>

export const UpdateUserProfileRequestSchema = z.object({
    displayName: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
})
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileRequestSchema>

export const AddMemberRequestSchema = z.object({
    userId: z.string(),
})
export type AddMemberRequest = z.infer<typeof AddMemberRequestSchema>

export const ChangeMemberRoleRequestSchema = z.object({
    role: z.string(),
})
export type ChangeMemberRoleRequest = z.infer<typeof ChangeMemberRoleRequestSchema>

export const MasterItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    nameEn: z.string(),
    sortOrder: z.number(),
})
export type MasterItem = z.infer<typeof MasterItemSchema>

export const CommunityMastersResponseSchema = z.object({
    categories: z.array(MasterItemSchema),
    participationLevels: z.array(MasterItemSchema),
})
export type CommunityMastersResponse = z.infer<typeof CommunityMastersResponseSchema>

export const SearchCommunitiesParamsSchema = z.object({
    keyword: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    levelIds: z.array(z.string()).optional(),
    area: z.string().optional(),
    days: z.array(z.string()).optional(),
    targetGender: z.array(z.string()).optional(),
    joinMethod: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
})
export type SearchCommunitiesParams = z.infer<typeof SearchCommunitiesParamsSchema>

export const PublicCommunitySearchItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    joinMethod: z.string(),
    memberCount: z.number(),
    categories: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })),
    participationLevels: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })),
    targetGender: z.array(z.string()),
    ageMin: z.number().nullable(),
    ageMax: z.number().nullable(),
    activityFrequency: z.string().nullable(),
})
export type PublicCommunitySearchItem = z.infer<typeof PublicCommunitySearchItemSchema>

export const SearchCommunitiesResponseSchema = z.object({
    communities: z.array(PublicCommunitySearchItemSchema),
    total: z.number(),
})
export type SearchCommunitiesResponse = z.infer<typeof SearchCommunitiesResponseSchema>

export const JoinCommunityResponseSchema = z.object({
    membershipId: z.string(),
})
export type JoinCommunityResponse = z.infer<typeof JoinCommunityResponseSchema>

export const JoinRequestBodySchema = z.object({
    message: z.string().optional(),
})
export type JoinRequestBody = z.infer<typeof JoinRequestBodySchema>

export const JoinRequestResponseSchema = z.object({
    joinRequestId: z.string(),
})
export type JoinRequestResponse = z.infer<typeof JoinRequestResponseSchema>

export const CreateActivityRequestSchema = z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    defaultPlaceId: z.string().nullable().optional(),
    defaultLocationCustom: z.string().nullable().optional(),
    defaultStartTime: z.string().nullable().optional(),
    defaultEndTime: z.string().nullable().optional(),
    recurrenceRule: z.string().nullable().optional(),
    organizerUserId: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    participationFee: z.number().optional(),
    visitorFee: z.number().nullable().optional(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    shouldPostAnnouncement: z.boolean().optional(),
    allowVisitorWaitlist: z.boolean().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    recurrenceGenerationMonths: z.number().nullable().optional(),
})
export type CreateActivityRequest = z.infer<typeof CreateActivityRequestSchema>

export const CreateActivityResponseSchema = z.object({
    activityId: z.string(),
    scheduleId: z.string().optional(),
})
export type CreateActivityResponse = z.infer<typeof CreateActivityResponseSchema>

export const ActivityListItemSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    communityName: z.string().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    defaultPlaceId: z.string().nullable(),
    defaultLocationCustom: z.string().nullable(),
    isOnline: z.boolean(),
    defaultPlace: z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
        lat: z.number(),
        lng: z.number(),
    }).nullable().optional(),
    defaultStartTime: z.string().nullable(),
    defaultEndTime: z.string().nullable(),
    organizerUserId: z.string().nullable(),
    createdBy: z.string(),
    createdByDisplayName: z.string().nullable(),
    upcomingSchedules: z.array(z.object({
        id: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
    })),
})
export type ActivityListItem = z.infer<typeof ActivityListItemSchema>

export const ListActivitiesResponseSchema = z.object({
    activities: z.array(ActivityListItemSchema),
})
export type ListActivitiesResponse = z.infer<typeof ListActivitiesResponseSchema>

export const ActivityDetailSchema = ActivityListItemSchema.merge(z.object({
    defaultParticipationFee: z.number().nullable(),
    defaultVisitorFee: z.number().nullable(),
    defaultCapacity: z.number().nullable(),
    allowVisitorWaitlist: z.boolean(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
    recurrenceRule: z.string().nullable(),
    organizerDisplayName: z.string().nullable(),
    deleted: z.boolean(),
    communityPaymentSettings: z.object({
        enabledPaymentMethods: z.array(z.string()),
        paypayId: z.string().nullable(),
        stripeAccountId: z.string().nullable(),
    }),
}))
export type ActivityDetail = z.infer<typeof ActivityDetailSchema>

export const UpdateActivityRequestSchema = z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    defaultPlaceId: z.string().nullable().optional(),
    defaultLocationCustom: z.string().nullable().optional(),
    isOnline: z.boolean().optional(),
    defaultStartTime: z.string().nullable().optional(),
    defaultEndTime: z.string().nullable().optional(),
    recurrenceRule: z.string().nullable().optional(),
    organizerUserId: z.string().nullable().optional(),
    defaultParticipationFee: z.number().nullable().optional(),
    defaultVisitorFee: z.number().nullable().optional(),
    defaultCapacity: z.number().nullable().optional(),
    allowVisitorWaitlist: z.boolean().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    recurrenceGenerationMonths: z.number().nullable().optional(),
})
export type UpdateActivityRequest = z.infer<typeof UpdateActivityRequestSchema>

export const ChangeOrganizerRequestSchema = z.object({
    organizerUserId: z.string().nullable().optional(),
})
export type ChangeOrganizerRequest = z.infer<typeof ChangeOrganizerRequestSchema>

export const PlaceSearchItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    category: z.string().nullable(),
    usageCount: z.number(),
})
export type PlaceSearchItem = z.infer<typeof PlaceSearchItemSchema>

export const CreateScheduleRequestSchema = z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    participationFee: z.number().optional(),
    visitorFee: z.number().nullable().optional(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().nullable().optional(),
})
export type CreateScheduleRequest = z.infer<typeof CreateScheduleRequestSchema>

export const CreateScheduleResponseSchema = z.object({
    scheduleId: z.string(),
})
export type CreateScheduleResponse = z.infer<typeof CreateScheduleResponseSchema>

export const ScheduleListItemSchema = z.object({
    id: z.string(),
    activityId: z.string(),
    communityId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().nullable(),
    note: z.string().nullable(),
    status: z.string(),
    capacity: z.number().nullable(),
    participationFee: z.number(),
    visitorFee: z.number().nullable(),
    isOnline: z.boolean(),
    meetingUrl: z.string().nullable(),
    participantCount: z.number().optional(),
    hasPayments: z.boolean().optional(),
    myStatus: z.enum(['none', 'attending', 'waitlisted']).optional(),
    myParticipationId: z.string().nullable().optional(),
    myPaymentMethod: z.string().nullable().optional(),
    myPaymentStatus: z.string().nullable().optional(),
    attendingCount: z.number().optional(),
    waitlistCount: z.number().optional(),
    enabledPaymentMethods: z.array(z.string()).optional(),
    paypayId: z.string().nullable().optional(),
})
export type ScheduleListItem = z.infer<typeof ScheduleListItemSchema>

export const ListSchedulesResponseSchema = z.object({
    schedules: z.array(ScheduleListItemSchema),
})
export type ListSchedulesResponse = z.infer<typeof ListSchedulesResponseSchema>

export const UpdateScheduleRequestSchema = z.object({
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    participationFee: z.number().optional(),
    visitorFee: z.number().nullable().optional(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().nullable().optional(),
})
export type UpdateScheduleRequest = z.infer<typeof UpdateScheduleRequestSchema>

export const UserScheduleItemSchema = z.object({
    scheduleId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().nullable(),
    status: z.string(),
    participationFee: z.number(),
    visitorFee: z.number().nullable(),
    isOnline: z.boolean(),
    meetingUrl: z.string().nullable(),
    activityId: z.string(),
    activityTitle: z.string(),
    communityId: z.string(),
    communityName: z.string(),
    organizerName: z.string().nullable().optional(),
    participantCount: z.number().optional(),
    capacity: z.number().nullable().optional(),
})
export type UserScheduleItem = z.infer<typeof UserScheduleItemSchema>

export const ListUserSchedulesResponseSchema = z.object({
    schedules: z.array(UserScheduleItemSchema),
})
export type ListUserSchedulesResponse = z.infer<typeof ListUserSchedulesResponseSchema>

export const AttendScheduleRequestSchema = z.object({
    isVisitor: z.boolean().optional(),
    paymentMethod: z.string().nullable().optional(),
})
export type AttendScheduleRequest = z.infer<typeof AttendScheduleRequestSchema>

export const AttendScheduleResponseSchema = z.object({
    participationId: z.string(),
})
export type AttendScheduleResponse = z.infer<typeof AttendScheduleResponseSchema>

export const JoinWaitlistResponseSchema = z.object({
    waitlistEntryId: z.string(),
})
export type JoinWaitlistResponse = z.infer<typeof JoinWaitlistResponseSchema>

export const ParticipantItemSchema = z.object({
    id: z.string(),
    userId: z.string().nullable(),
    displayName: z.string().nullable(),
    visitorName: z.string().nullable(),
    addedBy: z.string().nullable(),
    status: z.string(),
    isVisitor: z.boolean(),
    respondedAt: z.string(),
    paymentMethod: z.string().nullable(),
    paymentStatus: z.string().nullable(),
})
export type ParticipantItem = z.infer<typeof ParticipantItemSchema>

export const ListParticipantsResponseSchema = z.object({
    participants: z.array(ParticipantItemSchema),
})
export type ListParticipantsResponse = z.infer<typeof ListParticipantsResponseSchema>

export const WaitlistItemSchema = z.object({
    id: z.string(),
    userId: z.string(),
    displayName: z.string().nullable(),
    isVisitor: z.boolean(),
    visitorName: z.string().nullable(),
    position: z.number(),
    status: z.string(),
    registeredAt: z.string(),
})
export type WaitlistItem = z.infer<typeof WaitlistItemSchema>

export const ListWaitlistResponseSchema = z.object({
    entries: z.array(WaitlistItemSchema),
})
export type ListWaitlistResponse = z.infer<typeof ListWaitlistResponseSchema>

export const GetParticipationHistoryResponseSchema = z.object({
    hasPaidCancellation: z.boolean(),
    paymentMethod: z.string().nullable(),
    paymentStatus: z.string().nullable(),
    cancelledAt: z.string().nullable(),
})
export type GetParticipationHistoryResponse = z.infer<typeof GetParticipationHistoryResponseSchema>

export const RefundPendingPaymentItemSchema = z.object({
    paymentId: z.string(),
    scheduleId: z.string(),
    userId: z.string(),
    displayName: z.string().nullable(),
    paymentMethod: z.string(),
    amount: z.number(),
    feeAmount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    activityTitle: z.string().nullable(),
    scheduleDate: z.string().nullable(),
    scheduleStartTime: z.string().nullable(),
    paymentNumber: z.number(),
})
export type RefundPendingPaymentItem = z.infer<typeof RefundPendingPaymentItemSchema>

export const ListRefundPendingResponseSchema = z.object({
    payments: z.array(RefundPendingPaymentItemSchema),
})
export type ListRefundPendingResponse = z.infer<typeof ListRefundPendingResponseSchema>

export const ResolvedPaymentItemSchema = z.object({
    paymentId: z.string(),
    scheduleId: z.string(),
    userId: z.string(),
    displayName: z.string().nullable(),
    paymentMethod: z.string(),
    amount: z.number(),
    feeAmount: z.number(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    activityTitle: z.string().nullable(),
    scheduleDate: z.string().nullable(),
    scheduleStartTime: z.string().nullable(),
    paymentNumber: z.number(),
})
export type ResolvedPaymentItem = z.infer<typeof ResolvedPaymentItemSchema>

export const ListPaymentHistoryResponseSchema = z.object({
    payments: z.array(ResolvedPaymentItemSchema),
})
export type ListPaymentHistoryResponse = z.infer<typeof ListPaymentHistoryResponseSchema>

export const CreateAnnouncementRequestSchema = z.object({
    title: z.string(),
    content: z.string(),
    attachments: z.array(z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
    })).optional(),
})
export type CreateAnnouncementRequest = z.infer<typeof CreateAnnouncementRequestSchema>

export const CreateAnnouncementResponseSchema = z.object({
    announcementId: z.string(),
})
export type CreateAnnouncementResponse = z.infer<typeof CreateAnnouncementResponseSchema>

export const AnnouncementListItemSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    activityId: z.string().nullable(),
    authorId: z.string(),
    authorName: z.string().nullable(),
    authorAvatarUrl: z.string().nullable(),
    communityName: z.string(),
    communityLogoUrl: z.string().nullable(),
    title: z.string(),
    content: z.string(),
    isRead: z.boolean(),
    isBookmarked: z.boolean(),
    createdAt: z.string(),
    likeCount: z.number(),
    commentCount: z.number(),
    isLiked: z.boolean(),
    readCount: z.number(),
    attachments: z.array(z.object({
        id: z.string(),
        fileUrl: z.string(),
        mimeType: z.string(),
    })),
    scheduleInfo: z.object({
        scheduleId: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        scheduleStatus: z.string(),
    }).nullable(),
    activityDeleted: z.boolean(),
})
export type AnnouncementListItem = z.infer<typeof AnnouncementListItemSchema>

export const ListAnnouncementsResponseSchema = z.object({
    announcements: z.array(AnnouncementListItemSchema),
})
export type ListAnnouncementsResponse = z.infer<typeof ListAnnouncementsResponseSchema>

export const AnnouncementDetailSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    activityId: z.string().nullable(),
    authorId: z.string(),
    authorName: z.string().nullable(),
    authorAvatarUrl: z.string().nullable(),
    communityName: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string(),
    isRead: z.boolean(),
    isLiked: z.boolean(),
    isBookmarked: z.boolean(),
    likeCount: z.number(),
    commentCount: z.number(),
    readCount: z.number(),
    attachments: z.array(z.object({
        id: z.string(),
        fileUrl: z.string(),
        mimeType: z.string(),
    })),
    scheduleInfo: z.object({
        scheduleId: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        scheduleStatus: z.string(),
    }).nullable(),
    activityDeleted: z.boolean(),
})
export type AnnouncementDetail = z.infer<typeof AnnouncementDetailSchema>

export const AnnouncementFeedItemSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    activityId: z.string().nullable(),
    authorId: z.string(),
    authorName: z.string().nullable(),
    authorAvatarUrl: z.string().nullable(),
    communityName: z.string(),
    communityLogoUrl: z.string().nullable(),
    title: z.string(),
    content: z.string(),
    isRead: z.boolean(),
    isBookmarked: z.boolean(),
    createdAt: z.string(),
    likeCount: z.number(),
    commentCount: z.number(),
    isLiked: z.boolean(),
    readCount: z.number(),
    attachments: z.array(z.object({
        id: z.string(),
        fileUrl: z.string(),
        mimeType: z.string(),
    })),
    scheduleInfo: z.object({
        scheduleId: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        scheduleStatus: z.string(),
    }).nullable(),
    activityDeleted: z.boolean(),
})
export type AnnouncementFeedItem = z.infer<typeof AnnouncementFeedItemSchema>

export const AnnouncementFeedResponseSchema = z.object({
    items: z.array(AnnouncementFeedItemSchema),
    nextCursor: z.string().nullable(),
})
export type AnnouncementFeedResponse = z.infer<typeof AnnouncementFeedResponseSchema>

export const ToggleBookmarkResponseSchema = z.object({
    bookmarked: z.boolean(),
})
export type ToggleBookmarkResponse = z.infer<typeof ToggleBookmarkResponseSchema>

export const UpdateAnnouncementRequestSchema = z.object({
    title: z.string(),
    content: z.string(),
})
export type UpdateAnnouncementRequest = z.infer<typeof UpdateAnnouncementRequestSchema>

export const UpdateAnnouncementResponseSchema = z.object({
    id: z.string(),
})
export type UpdateAnnouncementResponse = z.infer<typeof UpdateAnnouncementResponseSchema>

export const ChatChannelSchema = z.object({
    channelId: z.string(),
    type: z.enum(['COMMUNITY', 'ACTIVITY', 'DM']),
    communityId: z.string().nullable().optional(),
    activityId: z.string().nullable().optional(),
    createdAt: z.string(),
})
export type ChatChannel = z.infer<typeof ChatChannelSchema>

export const MessageAttachmentSchema = z.object({
    id: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
})
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>

export const MessageReactionSummarySchema = z.object({
    stampId: z.string().nullable(),
    emoji: z.string().nullable(),
    stampImageUrl: z.string().nullable(),
    count: z.number(),
    reacted: z.boolean(),
})
export type MessageReactionSummary = z.infer<typeof MessageReactionSummarySchema>

export const MessageItemSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    senderId: z.string(),
    senderDisplayName: z.string().nullable(),
    senderAvatarUrl: z.string().nullable(),
    content: z.string(),
    mentions: z.unknown(),
    parentMessageId: z.string().nullable(),
    deletedBy: z.string().nullable(),
    attachments: z.array(MessageAttachmentSchema),
    reactions: z.array(MessageReactionSummarySchema),
    replyCount: z.number(),
    latestReply: z.object({
        senderDisplayName: z.string().nullable(),
        content: z.string(),
        createdAt: z.string(),
    }).nullable(),
    createdAt: z.string(),
})
export type MessageItem = z.infer<typeof MessageItemSchema>

export const ListMessagesResponseSchema = z.object({
    messages: z.array(MessageItemSchema),
    nextCursor: z.string().nullable(),
})
export type ListMessagesResponse = z.infer<typeof ListMessagesResponseSchema>

export const SearchMessagesResponseSchema = z.object({
    messages: z.array(MessageItemSchema),
    nextCursor: z.string().nullable(),
    query: z.string(),
})
export type SearchMessagesResponse = z.infer<typeof SearchMessagesResponseSchema>

export const SendMessageRequestSchema = z.object({
    content: z.string(),
    mentions: z.array(z.string()).optional(),
    parentMessageId: z.string().optional(),
})
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>

export const SendMessageResponseSchema = z.object({
    messageId: z.string(),
})
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>

export const MyChannelLastMessageSchema = z.object({
    id: z.string(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.string(),
})
export type MyChannelLastMessage = z.infer<typeof MyChannelLastMessageSchema>

export const MyCommunityChannelSchema = z.object({
    channelId: z.string(),
    type: z.literal('COMMUNITY'),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    communityId: z.string().nullable(),
    lastMessage: MyChannelLastMessageSchema.nullable(),
})
export type MyCommunityChannel = z.infer<typeof MyCommunityChannelSchema>

export const MyActivityChannelSchema = z.object({
    channelId: z.string(),
    type: z.literal('ACTIVITY'),
    name: z.string(),
    subtitle: z.string(),
    communityName: z.string(),
    communityId: z.string().nullable(),
    activityId: z.string().nullable(),
    scheduleDate: z.string().nullable(),
    scheduleStartTime: z.string().nullable(),
    scheduleEndTime: z.string().nullable(),
    lastMessage: MyChannelLastMessageSchema.nullable(),
})
export type MyActivityChannel = z.infer<typeof MyActivityChannelSchema>

export const MyDMChannelSchema = z.object({
    channelId: z.string(),
    type: z.literal('DM'),
    participants: z.array(z.string()),
    lastMessage: MyChannelLastMessageSchema.nullable(),
})
export type MyDMChannel = z.infer<typeof MyDMChannelSchema>

export const MyChannelsResponseSchema = z.object({
    community: z.array(MyCommunityChannelSchema),
    activity: z.array(MyActivityChannelSchema),
    dm: z.array(MyDMChannelSchema),
})
export type MyChannelsResponse = z.infer<typeof MyChannelsResponseSchema>

export const TreeLastMessageSchema = z.object({
    id: z.string(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.string(),
})
export type TreeLastMessage = z.infer<typeof TreeLastMessageSchema>

export const ActivityTreeNodeSchema = z.object({
    activityId: z.string(),
    name: z.string(),
    channelId: z.string().nullable(),
    unreadCount: z.number(),
    scheduleDate: z.string().nullable(),
    scheduleStartTime: z.string().nullable(),
    scheduleEndTime: z.string().nullable(),
    lastMessage: TreeLastMessageSchema.nullable(),
})
export type ActivityTreeNode = z.infer<typeof ActivityTreeNodeSchema>

export const CommunityTreeNodeSchema: z.ZodType<any> = z.object({
    communityId: z.string(),
    name: z.string(),
    logoUrl: z.string().nullable(),
    channelId: z.string().nullable(),
    unreadCount: z.number(),
    lastMessage: TreeLastMessageSchema.nullable(),
    children: z.array(z.lazy((): z.ZodType<any> => CommunityTreeNodeSchema)),
})
export type CommunityTreeNode = z.infer<typeof CommunityTreeNodeSchema>

export const ActivityCommunityTreeNodeSchema: z.ZodType<any> = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityLogoUrl: z.string().nullable(),
    activities: z.array(ActivityTreeNodeSchema),
    children: z.array(z.lazy((): z.ZodType<any> => ActivityCommunityTreeNodeSchema)),
    unreadCount: z.number(),
})
export type ActivityCommunityTreeNode = z.infer<typeof ActivityCommunityTreeNodeSchema>

export const DMTreeItemSchema = z.object({
    channelId: z.string(),
    participants: z.array(z.string()),
    unreadCount: z.number(),
    lastMessage: TreeLastMessageSchema.nullable(),
})
export type DMTreeItem = z.infer<typeof DMTreeItemSchema>

export const CommunityChannelTreeResponseSchema = z.object({
    communities: z.array(CommunityTreeNodeSchema),
    activityTree: z.array(ActivityCommunityTreeNodeSchema),
    dm: z.array(DMTreeItemSchema),
})
export type CommunityChannelTreeResponse = z.infer<typeof CommunityChannelTreeResponseSchema>

export const CreateDMRequestSchema = z.object({
    participantIds: z.array(z.string()),
})
export type CreateDMRequest = z.infer<typeof CreateDMRequestSchema>

export const CreateDMResponseSchema = z.object({
    channelId: z.string(),
    type: z.literal('DM'),
    participants: z.array(z.string()),
})
export type CreateDMResponse = z.infer<typeof CreateDMResponseSchema>

export const StampItemSchema = z.object({
    id: z.string(),
    createdByUserId: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    createdAt: z.string(),
})
export type StampItem = z.infer<typeof StampItemSchema>

export const ListStampsResponseSchema = z.object({
    stamps: z.array(StampItemSchema),
})
export type ListStampsResponse = z.infer<typeof ListStampsResponseSchema>

export const CreateStampRequestSchema = z.object({
    name: z.string(),
    imageUrl: z.string(),
})
export type CreateStampRequest = z.infer<typeof CreateStampRequestSchema>

export const NotificationItemSchema = z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    body: z.string().nullable(),
    referenceId: z.string().nullable(),
    referenceType: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    isRead: z.boolean(),
    createdAt: z.string(),
})
export type NotificationItem = z.infer<typeof NotificationItemSchema>

export const ListNotificationsResponseSchema = z.object({
    notifications: z.array(NotificationItemSchema),
    nextCursor: z.string().nullable(),
})
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>

export const UnreadCountResponseSchema = z.object({
    unreadCount: z.number(),
})
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>

export const CreateCreditCardPaymentIntentResponseSchema = z.object({
    clientSecret: z.string(),
    paymentIntentId: z.string(),
    totalAmount: z.number(),
    platformFee: z.number(),
    baseFee: z.number(),
})
export type CreateCreditCardPaymentIntentResponse = z.infer<typeof CreateCreditCardPaymentIntentResponseSchema>

export const ToggleLikeResponseSchema = z.object({
    liked: z.boolean(),
    likeCount: z.number(),
})
export type ToggleLikeResponse = z.infer<typeof ToggleLikeResponseSchema>

export const CreateCommentRequestSchema = z.object({
    content: z.string(),
})
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>

export const CreateCommentResponseSchema = z.object({
    commentId: z.string(),
})
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>

export const CommentItemSchema = z.object({
    id: z.string(),
    announcementId: z.string(),
    userId: z.string(),
    userName: z.string().nullable(),
    userAvatarUrl: z.string().nullable(),
    content: z.string(),
    createdAt: z.string(),
})
export type CommentItem = z.infer<typeof CommentItemSchema>

export const ListCommentsResponseSchema = z.object({
    comments: z.array(CommentItemSchema),
    nextCursor: z.string().nullable(),
})
export type ListCommentsResponse = z.infer<typeof ListCommentsResponseSchema>

export const SearchAnnouncementsResponseSchema = z.object({
    items: z.array(AnnouncementFeedItemSchema),
})
export type SearchAnnouncementsResponse = z.infer<typeof SearchAnnouncementsResponseSchema>

export const CreateAlbumRequestSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
})
export type CreateAlbumRequest = z.infer<typeof CreateAlbumRequestSchema>

export const CreateAlbumResponseSchema = z.object({
    albumId: z.string(),
})
export type CreateAlbumResponse = z.infer<typeof CreateAlbumResponseSchema>

export const AlbumItemSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    createdBy: z.string(),
    createdAt: z.string(),
    photoCount: z.number(),
    coverUrl: z.string().nullable(),
})
export type AlbumItem = z.infer<typeof AlbumItemSchema>

export const ListAlbumsResponseSchema = z.object({
    albums: z.array(AlbumItemSchema),
})
export type ListAlbumsResponse = z.infer<typeof ListAlbumsResponseSchema>

export const AddAlbumPhotoRequestSchema = z.object({
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
})
export type AddAlbumPhotoRequest = z.infer<typeof AddAlbumPhotoRequestSchema>

export const AddAlbumPhotoResponseSchema = z.object({
    photoId: z.string(),
})
export type AddAlbumPhotoResponse = z.infer<typeof AddAlbumPhotoResponseSchema>

export const AlbumPhotoItemSchema = z.object({
    id: z.string(),
    albumId: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
    uploadedBy: z.string(),
    createdAt: z.string(),
})
export type AlbumPhotoItem = z.infer<typeof AlbumPhotoItemSchema>

export const ListAlbumPhotosResponseSchema = z.object({
    photos: z.array(AlbumPhotoItemSchema),
})
export type ListAlbumPhotosResponse = z.infer<typeof ListAlbumPhotosResponseSchema>

export const ActivityStatsItemSchema = z.object({
    activityId: z.string(),
    activityTitle: z.string(),
    totalSchedules: z.number(),
    totalAttending: z.number(),
    totalCancelled: z.number(),
    attendanceRate: z.number(),
})
export type ActivityStatsItem = z.infer<typeof ActivityStatsItemSchema>

export const MonthlyStatsItemSchema = z.object({
    month: z.string(),
    totalSchedules: z.number(),
    totalAttending: z.number(),
    attendanceRate: z.number(),
})
export type MonthlyStatsItem = z.infer<typeof MonthlyStatsItemSchema>

export const CommunityStatsResponseSchema = z.object({
    communityId: z.string(),
    totalMembers: z.number(),
    totalActivities: z.number(),
    totalSchedules: z.number(),
    totalParticipations: z.number(),
    overallAttendanceRate: z.number(),
    byActivity: z.array(ActivityStatsItemSchema),
    byMonth: z.array(MonthlyStatsItemSchema),
})
export type CommunityStatsResponse = z.infer<typeof CommunityStatsResponseSchema>

export const TrendPointItemSchema = z.object({
    month: z.string(),
    uniqueParticipants: z.number(),
    totalAttendances: z.number(),
    newParticipants: z.number(),
})
export type TrendPointItem = z.infer<typeof TrendPointItemSchema>

export const ParticipationTrendResponseSchema = z.object({
    communityId: z.string(),
    trend: z.array(TrendPointItemSchema),
})
export type ParticipationTrendResponse = z.infer<typeof ParticipationTrendResponseSchema>

export const AbsenceItemSchema = z.object({
    participationId: z.string(),
    scheduleId: z.string(),
    activityTitle: z.string(),
    scheduleDate: z.string(),
    userId: z.string(),
    displayName: z.string().nullable(),
    cancelledAt: z.string(),
    isSameDayCancel: z.boolean(),
})
export type AbsenceItem = z.infer<typeof AbsenceItemSchema>

export const AbsenceSummaryDataSchema = z.object({
    totalCancellations: z.number(),
    sameDayCancellations: z.number(),
    frequentCancellers: z.array(z.object({
        userId: z.string(),
        displayName: z.string().nullable(),
        cancelCount: z.number(),
        sameDayCancelCount: z.number(),
    })),
})
export type AbsenceSummaryData = z.infer<typeof AbsenceSummaryDataSchema>

export const AbsenceReportResponseSchema = z.object({
    communityId: z.string(),
    summary: AbsenceSummaryDataSchema,
    items: z.array(AbsenceItemSchema),
})
export type AbsenceReportResponse = z.infer<typeof AbsenceReportResponseSchema>

export const AddVisitorRequestSchema = z.object({
    visitorName: z.string(),
    paymentMethod: z.string().nullable().optional(),
})
export type AddVisitorRequest = z.infer<typeof AddVisitorRequestSchema>

export const AddVisitorResponseSchema = z.object({
    participationId: z.string(),
    waitlisted: z.boolean(),
})
export type AddVisitorResponse = z.infer<typeof AddVisitorResponseSchema>

export const UpdateVisitorPaymentRequestSchema = z.object({
    paymentMethod: z.string(),
    paymentStatus: z.string().optional(),
})
export type UpdateVisitorPaymentRequest = z.infer<typeof UpdateVisitorPaymentRequestSchema>

export const ExpenseCategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    isSystem: z.boolean(),
    sortOrder: z.number(),
    isActive: z.boolean(),
})
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>

export const ListExpenseCategoriesResponseSchema = z.object({
    categories: z.array(ExpenseCategorySchema),
})
export type ListExpenseCategoriesResponse = z.infer<typeof ListExpenseCategoriesResponseSchema>

export const ExpenseItemSchema = z.object({
    id: z.string(),
    categoryId: z.string(),
    categoryName: z.string(),
    amount: z.number(),
    description: z.string().nullable(),
    date: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
})
export type ExpenseItem = z.infer<typeof ExpenseItemSchema>

export const ListExpensesResponseSchema = z.object({
    expenses: z.array(ExpenseItemSchema),
})
export type ListExpensesResponse = z.infer<typeof ListExpensesResponseSchema>

export const CreateExpenseRequestSchema = z.object({
    categoryId: z.string(),
    amount: z.number(),
    description: z.string().nullable().optional(),
    date: z.string(),
})
export type CreateExpenseRequest = z.infer<typeof CreateExpenseRequestSchema>

export const FinanceSummaryResponseSchema = z.object({
    totalExpense: z.number(),
    expensesByCategory: z.array(z.object({
        categoryId: z.string(),
        categoryName: z.string(),
        total: z.number(),
    })),
})
export type FinanceSummaryResponse = z.infer<typeof FinanceSummaryResponseSchema>

export const CommunityIncomeResponseSchema = z.object({
    totalIncome: z.number(),
    incomeByActivity: z.array(z.object({
        activityId: z.string(),
        activityTitle: z.string(),
        total: z.number(),
    })),
})
export type CommunityIncomeResponse = z.infer<typeof CommunityIncomeResponseSchema>

export const ActivityIncomeDetailResponseSchema = z.object({
    schedules: z.array(z.object({
        scheduleId: z.string(),
        label: z.string(),
        total: z.number(),
        payments: z.array(z.object({
            displayName: z.string().nullable(),
            amount: z.number(),
            isVisitor: z.boolean(),
            isGuest: z.boolean(),
        })),
    })),
})
export type ActivityIncomeDetailResponse = z.infer<typeof ActivityIncomeDetailResponseSchema>

export const FinanceSummaryTreeResponseSchema = z.object({
    communities: z.array(z.object({
        communityId: z.string(),
        communityName: z.string(),
        income: z.number(),
        expense: z.number(),
        balance: z.number(),
    })),
    totals: z.object({
        income: z.number(),
        expense: z.number(),
        balance: z.number(),
    }),
})
export type FinanceSummaryTreeResponse = z.infer<typeof FinanceSummaryTreeResponseSchema>

export const CreateExpenseCategoryRequestSchema = z.object({
    name: z.string(),
})
export type CreateExpenseCategoryRequest = z.infer<typeof CreateExpenseCategoryRequestSchema>

export const UpdateExpenseCategoryRequestSchema = z.object({
    name: z.string(),
})
export type UpdateExpenseCategoryRequest = z.infer<typeof UpdateExpenseCategoryRequestSchema>

export const MatchingModeSchema = z.enum(['RANDOM', 'MIXED_LEVEL', 'SAME_LEVEL'])
export type MatchingMode = z.infer<typeof MatchingModeSchema>

export const MatchingParticipantSchema = z.object({
    participationId: z.string(),
    userId: z.string().nullable(),
    displayName: z.string(),
    level: z.number(),
    isVisitor: z.boolean(),
})
export type MatchingParticipant = z.infer<typeof MatchingParticipantSchema>

export const MatchingRoundSchema = z.object({
    roundNo: z.number(),
    looped: z.boolean().optional(),
    courts: z.array(z.object({
        courtNo: z.number(),
        duplicatedFromRoundNo: z.number().optional(),
        groups: z.array(z.object({
            groupNo: z.number(),
            participants: z.array(MatchingParticipantSchema),
        })),
    })),
})
export type MatchingRound = z.infer<typeof MatchingRoundSchema>

export const MatchingResultSchema = z.object({
    id: z.string(),
    scheduleId: z.string(),
    mode: MatchingModeSchema,
    params: z.object({
        rounds: z.number(),
        courtCount: z.number(),
        groupsPerCourt: z.number(),
        playersPerGroup: z.number(),
        categoryId: z.string().nullable().optional(),
        categoryName: z.string().nullable().optional(),
        formatName: z.string().nullable().optional(),
        fixedPairs: z.array(z.unknown()).optional(),
    }),
    rounds: z.array(MatchingRoundSchema),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
export type MatchingResult = z.infer<typeof MatchingResultSchema>

export const CategoryMatchFormatSchema = z.object({
    id: z.string(),
    name: z.string(),
    playersPerGroup: z.number(),
    groupsPerCourt: z.number(),
    sortOrder: z.number(),
    isDefault: z.boolean(),
})
export type CategoryMatchFormat = z.infer<typeof CategoryMatchFormatSchema>

export const CategoryWithMatchFormatsSchema = z.object({
    id: z.string(),
    name: z.string(),
    nameEn: z.string(),
    formats: z.array(CategoryMatchFormatSchema),
})
export type CategoryWithMatchFormats = z.infer<typeof CategoryWithMatchFormatsSchema>

export const ListCategoryMatchFormatsResponseSchema = z.object({
    categories: z.array(CategoryWithMatchFormatsSchema),
})
export type ListCategoryMatchFormatsResponse = z.infer<typeof ListCategoryMatchFormatsResponseSchema>

export const ListParticipantLevelsResponseSchema = z.object({
    participants: z.array(MatchingParticipantSchema),
})
export type ListParticipantLevelsResponse = z.infer<typeof ListParticipantLevelsResponseSchema>

export const WebhookConfigSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    service: z.string(),
    webhookUrl: z.string(),
    enabled: z.boolean(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>

export const PollOptionResultSchema = z.object({
    id: z.string(),
    text: z.string(),
    sortOrder: z.number(),
    voteCount: z.number(),
    voters: z.array(z.object({
        userId: z.string(),
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
    })),
})
export type PollOptionResult = z.infer<typeof PollOptionResultSchema>

export const PollResultSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    announcementId: z.string().nullable(),
    question: z.string(),
    isMultipleChoice: z.boolean(),
    deadline: z.string().nullable(),
    createdBy: z.string(),
    createdAt: z.string(),
    options: z.array(PollOptionResultSchema),
    totalVotes: z.number(),
    myVotedOptionIds: z.array(z.string()),
})
export type PollResult = z.infer<typeof PollResultSchema>

export const InquiryCategoryDtoSchema = z.object({
    id: z.string(),
    slug: z.string(),
    labelI18n: z.record(z.string(), z.string()),
    relatedHelpCategorySlug: z.string().nullable(),
    isAnonymousOnly: z.boolean(),
})
export type InquiryCategoryDto = z.infer<typeof InquiryCategoryDtoSchema>

export const InquiryAttachmentDtoSchema = z.object({
    id: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    scanStatus: z.enum(['PENDING', 'CLEAN', 'INFECTED', 'ERROR']),
})
export type InquiryAttachmentDto = z.infer<typeof InquiryAttachmentDtoSchema>

export const InquiryMessageDtoSchema = z.object({
    id: z.string(),
    authorType: z.enum(['USER', 'OPERATOR']),
    body: z.string(),
    createdAt: z.string(),
    attachments: z.array(InquiryAttachmentDtoSchema),
})
export type InquiryMessageDto = z.infer<typeof InquiryMessageDtoSchema>

export const InquirySummaryDtoSchema = z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    lastActivityAt: z.string(),
    createdAt: z.string(),
    category: z.object({
        slug: z.string(),
        labelI18n: z.record(z.string(), z.string()),
    }),
})
export type InquirySummaryDto = z.infer<typeof InquirySummaryDtoSchema>

export const InquiryDetailDtoSchema = InquirySummaryDtoSchema.merge(z.object({
    messages: z.array(InquiryMessageDtoSchema),
}))
export type InquiryDetailDto = z.infer<typeof InquiryDetailDtoSchema>

export const AdminInquirySummaryDtoSchema = InquirySummaryDtoSchema.merge(z.object({
    user: z.object({
        id: z.string(),
        displayName: z.string().nullable(),
        email: z.string().nullable(),
    }).nullable(),
    contactEmail: z.string().nullable(),
    assignee: z.object({
        id: z.string(),
        displayName: z.string().nullable(),
        email: z.string().nullable(),
    }).nullable(),
}))
export type AdminInquirySummaryDto = z.infer<typeof AdminInquirySummaryDtoSchema>

export const AdminInquiryDetailResponseSchema = InquiryDetailDtoSchema.merge(z.object({
    user: z.unknown(),
    contactEmail: z.string().nullable(),
    assignee: z.unknown(),
}))
export type AdminInquiryDetailResponse = z.infer<typeof AdminInquiryDetailResponseSchema>

export const SystemAdminUserDtoSchema = z.object({
    id: z.string(),
    displayName: z.string().nullable(),
    email: z.string().nullable(),
    systemRole: z.enum(['OPERATOR', 'SUPER_ADMIN']),
})
export type SystemAdminUserDto = z.infer<typeof SystemAdminUserDtoSchema>

export const ListInquiryCategoriesResponseSchema = z.object({
    categories: z.array(InquiryCategoryDtoSchema),
})
export type ListInquiryCategoriesResponse = z.infer<typeof ListInquiryCategoriesResponseSchema>

export const ListAdminInquiriesResponseSchema = z.object({
    inquiries: z.array(AdminInquirySummaryDtoSchema),
})
export type ListAdminInquiriesResponse = z.infer<typeof ListAdminInquiriesResponseSchema>

export const ListSystemAdminsResponseSchema = z.object({
    users: z.array(SystemAdminUserDtoSchema),
})
export type ListSystemAdminsResponse = z.infer<typeof ListSystemAdminsResponseSchema>

export const BookmarkedCommunityItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    coverUrl: z.string().nullable(),
    joinMethod: z.string(),
    isPublic: z.boolean(),
})
export type BookmarkedCommunityItem = z.infer<typeof BookmarkedCommunityItemSchema>

export const BookmarkedCommunitiesResponseSchema = z.object({
    communities: z.array(BookmarkedCommunityItemSchema),
})
export type BookmarkedCommunitiesResponse = z.infer<typeof BookmarkedCommunitiesResponseSchema>

export const PlaceSearchResponseSchema = z.object({
    items: z.array(PlaceSearchItemSchema),
})
export type PlaceSearchResponse = z.infer<typeof PlaceSearchResponseSchema>

export const PlanMasterDTOSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    description: z.string().nullable(),
    monthlyPrice: z.number().nullable(),
    oneTimePrice: z.number().nullable(),
    sortOrder: z.number(),
})
export type PlanMasterDTO = z.infer<typeof PlanMasterDTOSchema>

export const ListPlansResponseSchema = z.object({
    plans: z.array(PlanMasterDTOSchema),
})
export type ListPlansResponse = z.infer<typeof ListPlansResponseSchema>

export const UserLocaleResponseSchema = z.object({
    locale: z.string().nullable(),
})
export type UserLocaleResponse = z.infer<typeof UserLocaleResponseSchema>

export const ListCategoriesResponseSchema = z.object({
    categories: z.array(MasterItemSchema),
})
export type ListCategoriesResponse = z.infer<typeof ListCategoriesResponseSchema>

export const ListParticipationLevelsResponseSchema = z.object({
    participationLevels: z.array(MasterItemSchema),
})
export type ListParticipationLevelsResponse = z.infer<typeof ListParticipationLevelsResponseSchema>

export const VisitorNamesResponseSchema = z.object({
    names: z.array(z.string()),
})
export type VisitorNamesResponse = z.infer<typeof VisitorNamesResponseSchema>

export const DmLastMessageSchema = z.object({
    id: z.string(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.string(),
})
export type DmLastMessage = z.infer<typeof DmLastMessageSchema>

export const DmChannelItemSchema = z.object({
    channelId: z.string(),
    participants: z.array(z.string()),
    lastMessage: DmLastMessageSchema.nullable(),
})
export type DmChannelItem = z.infer<typeof DmChannelItemSchema>

export const ListDmChannelsResponseSchema = z.object({
    channels: z.array(DmChannelItemSchema),
})
export type ListDmChannelsResponse = z.infer<typeof ListDmChannelsResponseSchema>

export const OAuthProviderSchema = z.enum(['google', 'line', 'apple'])
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>

export const ListWebhookConfigsResponseSchema = z.array(WebhookConfigSchema)
export type ListWebhookConfigsResponse = z.infer<typeof ListWebhookConfigsResponseSchema>

export const ListPollsResponseSchema = z.array(PollResultSchema)
export type ListPollsResponse = z.infer<typeof ListPollsResponseSchema>
