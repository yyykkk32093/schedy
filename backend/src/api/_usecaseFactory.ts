// src/api/_usecaseFactory.ts
import { ApplicationEventBootstrap } from '@/_bootstrap/ApplicationEventBootstrap.js'
import { DomainEventBootstrap } from '@/_bootstrap/DomainEventBootstrap.js'
import { RealtimeEmitterBootstrap } from '@/_bootstrap/RealtimeEmitterBootstrap.js'
import { prisma } from '@/_sharedTech/db/client.js'
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'
import { DomainEventFlusher } from '@/application/_sharedApplication/event/DomainEventFlusher.js'
import { NotificationRepositoryImpl } from '@/application/_sharedApplication/notification/NotificationRepositoryImpl.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { OutboxEventFactory } from '@/application/_sharedApplication/outbox/OutboxEventFactory.js'
import { PrismaUnitOfWork } from '@/application/_sharedApplication/uow/PrismaUnitOfWork.js'
import { CreateActivityTxRepositories, CreateActivityUseCase } from '@/application/activity/usecase/CreateActivityUseCase.js'
import { FindActivityUseCase } from '@/application/activity/usecase/FindActivityUseCase.js'
import { ListActivitiesUseCase } from '@/application/activity/usecase/ListActivitiesUseCase.js'
import { SoftDeleteActivityTxRepositories, SoftDeleteActivityUseCase } from '@/application/activity/usecase/SoftDeleteActivityUseCase.js'
import { UpdateActivityTxRepositories, UpdateActivityUseCase } from '@/application/activity/usecase/UpdateActivityUseCase.js'
import { CreateAnnouncementCommentUseCase } from '@/application/announcement/usecase/CreateAnnouncementCommentUseCase.js'
import { CreateAnnouncementTxRepositories, CreateAnnouncementUseCase } from '@/application/announcement/usecase/CreateAnnouncementUseCase.js'
import { DeleteAnnouncementCommentUseCase } from '@/application/announcement/usecase/DeleteAnnouncementCommentUseCase.js'
import { DeleteAnnouncementTxRepositories, DeleteAnnouncementUseCase } from '@/application/announcement/usecase/DeleteAnnouncementUseCase.js'
import { FindAnnouncementUseCase } from '@/application/announcement/usecase/FindAnnouncementUseCase.js'
import { GetAnnouncementFeedUseCase } from '@/application/announcement/usecase/GetAnnouncementFeedUseCase.js'
import { ListAnnouncementCommentsUseCase } from '@/application/announcement/usecase/ListAnnouncementCommentsUseCase.js'
import { ListAnnouncementsUseCase } from '@/application/announcement/usecase/ListAnnouncementsUseCase.js'
import { MarkAnnouncementAsReadUseCase } from '@/application/announcement/usecase/MarkAnnouncementAsReadUseCase.js'
import { SearchAnnouncementsUseCase } from '@/application/announcement/usecase/SearchAnnouncementsUseCase.js'
import { ToggleAnnouncementBookmarkUseCase } from '@/application/announcement/usecase/ToggleAnnouncementBookmarkUseCase.js'
import { ToggleAnnouncementLikeUseCase } from '@/application/announcement/usecase/ToggleAnnouncementLikeUseCase.js'
import { UpdateAnnouncementTxRepositories, UpdateAnnouncementUseCase } from '@/application/announcement/usecase/UpdateAnnouncementUseCase.js'
import type { AuthMethod } from '@/application/auth/model/AuthMethod.js'
import {
    SignInOAuthUserTxRepositories,
    SignInOAuthUserUseCase,
} from '@/application/auth/oauth/usecase/SignInOAuthUserUseCase.js'
import {
    SignInPasswordUserTxRepositories,
    SignInPasswordUserUseCase,
} from '@/application/auth/password/usecase/SignInPasswordUserUseCase.js'
import { HandleRevenueCatWebhookUseCase } from '@/application/billing/usecase/HandleRevenueCatWebhookUseCase.js'
import { AcceptInviteTxRepositories, AcceptInviteUseCase } from '@/application/community/usecase/AcceptInviteUseCase.js'
import { AddMemberTxRepositories, AddMemberUseCase } from '@/application/community/usecase/AddMemberUseCase.js'
import { ChangeMemberRoleTxRepositories, ChangeMemberRoleUseCase } from '@/application/community/usecase/ChangeMemberRoleUseCase.js'
import { CreateCommunityTxRepositories, CreateCommunityUseCase } from '@/application/community/usecase/CreateCommunityUseCase.js'
import { CreateSubCommunityTxRepositories, CreateSubCommunityUseCase } from '@/application/community/usecase/CreateSubCommunityUseCase.js'
import { FindCommunityUseCase } from '@/application/community/usecase/FindCommunityUseCase.js'
import { FindPublicCommunityUseCase } from '@/application/community/usecase/FindPublicCommunityUseCase.js'
import { GenerateInviteTokenUseCase } from '@/application/community/usecase/GenerateInviteTokenUseCase.js'
import { JoinCommunityTxRepositories, JoinCommunityUseCase } from '@/application/community/usecase/JoinCommunityUseCase.js'
import { LeaveCommunityTxRepositories, LeaveCommunityUseCase } from '@/application/community/usecase/LeaveCommunityUseCase.js'
import { ListCommunitiesUseCase } from '@/application/community/usecase/ListCommunitiesUseCase.js'
import { ListCommunityAuditLogsUseCase } from '@/application/community/usecase/ListCommunityAuditLogsUseCase.js'
import { ListMembersUseCase } from '@/application/community/usecase/ListMembersUseCase.js'
import { RemoveMemberTxRepositories, RemoveMemberUseCase } from '@/application/community/usecase/RemoveMemberUseCase.js'
import { RequestJoinCommunityTxRepositories, RequestJoinCommunityUseCase } from '@/application/community/usecase/RequestJoinCommunityUseCase.js'
import { SearchCommunitiesUseCase } from '@/application/community/usecase/SearchCommunitiesUseCase.js'
import { SoftDeleteCommunityTxRepositories, SoftDeleteCommunityUseCase } from '@/application/community/usecase/SoftDeleteCommunityUseCase.js'
import { UpdateCommunityTxRepositories, UpdateCommunityUseCase } from '@/application/community/usecase/UpdateCommunityUseCase.js'
import { AttendScheduleTxRepositories, AttendScheduleUseCase } from '@/application/participation/usecase/AttendScheduleUseCase.js'
import { CancelParticipationTxRepositories, CancelParticipationUseCase } from '@/application/participation/usecase/CancelParticipationUseCase.js'
import { CancelWaitlistTxRepositories, CancelWaitlistUseCase } from '@/application/participation/usecase/CancelWaitlistUseCase.js'
import { ConfirmPaymentUseCase } from '@/application/participation/usecase/ConfirmPaymentUseCase.js'
import { JoinWaitlistTxRepositories, JoinWaitlistUseCase } from '@/application/participation/usecase/JoinWaitlistUseCase.js'
import { ListParticipationsUseCase } from '@/application/participation/usecase/ListParticipationsUseCase.js'
import { ListWaitlistEntriesUseCase } from '@/application/participation/usecase/ListWaitlistEntriesUseCase.js'
import { RemoveParticipantByAdminTxRepositories, RemoveParticipantByAdminUseCase } from '@/application/participation/usecase/RemoveParticipantByAdminUseCase.js'
import { ReportPaymentUseCase } from '@/application/participation/usecase/ReportPaymentUseCase.js'

import { AddAlbumPhotoUseCase } from '@/application/album/usecase/AddAlbumPhotoUseCase.js'
import { CreateAlbumUseCase } from '@/application/album/usecase/CreateAlbumUseCase.js'
import { DeleteAlbumPhotoUseCase } from '@/application/album/usecase/DeleteAlbumPhotoUseCase.js'
import { ListAlbumPhotosUseCase } from '@/application/album/usecase/ListAlbumPhotosUseCase.js'
import { ListAlbumsUseCase } from '@/application/album/usecase/ListAlbumsUseCase.js'
import { ExportAccountingUseCase } from '@/application/analytics/usecase/ExportAccountingUseCase.js'
import { ExportCalendarUseCase } from '@/application/analytics/usecase/ExportCalendarUseCase.js'
import { ExportParticipationCsvUseCase } from '@/application/analytics/usecase/ExportParticipationCsvUseCase.js'
import { GetAbsenceReportUseCase } from '@/application/analytics/usecase/GetAbsenceReportUseCase.js'
import { GetCommunityStatsUseCase } from '@/application/analytics/usecase/GetCommunityStatsUseCase.js'
import { GetParticipationTrendUseCase } from '@/application/analytics/usecase/GetParticipationTrendUseCase.js'

import { CastVoteUseCase } from '@/application/poll/usecase/CastVoteUseCase.js'
import { CreatePollTxRepositories, CreatePollUseCase } from '@/application/poll/usecase/CreatePollUseCase.js'
import { DeletePollUseCase } from '@/application/poll/usecase/DeletePollUseCase.js'
import { GetPollResultUseCase } from '@/application/poll/usecase/GetPollResultUseCase.js'
import { ListPollsUseCase } from '@/application/poll/usecase/ListPollsUseCase.js'
import { DeleteWebhookConfigUseCase } from '@/application/webhook/usecase/DeleteWebhookConfigUseCase.js'
import { GetWebhookConfigsUseCase } from '@/application/webhook/usecase/GetWebhookConfigsUseCase.js'
import { UpsertWebhookConfigUseCase } from '@/application/webhook/usecase/UpsertWebhookConfigUseCase.js'

import { CancelScheduleTxRepositories, CancelScheduleUseCase } from '@/application/schedule/usecase/CancelScheduleUseCase.js'
import { CreateScheduleTxRepositories, CreateScheduleUseCase } from '@/application/schedule/usecase/CreateScheduleUseCase.js'
import { FindScheduleUseCase } from '@/application/schedule/usecase/FindScheduleUseCase.js'
import { ListSchedulesUseCase } from '@/application/schedule/usecase/ListSchedulesUseCase.js'
import { ListUserSchedulesUseCase } from '@/application/schedule/usecase/ListUserSchedulesUseCase.js'
import { UpdateScheduleTxRepositories, UpdateScheduleUseCase } from '@/application/schedule/usecase/UpdateScheduleUseCase.js'
import { RegisterUserService } from '@/application/user/service/RegisterUserService.js'
import { GetUserProfileUseCase } from '@/application/user/usecase/GetUserProfileUseCase.js'
import { SignUpUserTxRepositories, SignUpUserUseCase } from '@/application/user/usecase/SignUpUserUseCase.js'
import { UpdateUserProfileUseCase } from '@/application/user/usecase/UpdateUserProfileUseCase.js'
import { UuidGenerator } from '@/domains/_sharedDomains/infrastructure/id/UuidGenerator.js'
import { ActivityRepositoryImpl } from '@/domains/activity/infrastructure/repository/ActivityRepositoryImpl.js'
import { ScheduleRepositoryImpl } from '@/domains/activity/schedule/infrastructure/repository/ScheduleRepositoryImpl.js'
import { ParticipationRepositoryImpl } from '@/domains/activity/schedule/participation/infrastructure/repository/ParticipationRepositoryImpl.js'
import { WaitlistEntryRepositoryImpl } from '@/domains/activity/schedule/waitlist/infrastructure/repository/WaitlistEntryRepositoryImpl.js'
import { AlbumPhotoRepositoryImpl } from '@/domains/album/infrastructure/repository/AlbumPhotoRepositoryImpl.js'
import { AlbumRepositoryImpl } from '@/domains/album/infrastructure/repository/AlbumRepositoryImpl.js'
import { AnnouncementBookmarkRepositoryImpl } from '@/domains/announcement/infrastructure/repository/AnnouncementBookmarkRepositoryImpl.js'
import { AnnouncementCommentRepositoryImpl } from '@/domains/announcement/infrastructure/repository/AnnouncementCommentRepositoryImpl.js'
import { AnnouncementLikeRepositoryImpl } from '@/domains/announcement/infrastructure/repository/AnnouncementLikeRepositoryImpl.js'
import { AnnouncementReadRepositoryImpl } from '@/domains/announcement/infrastructure/repository/AnnouncementReadRepositoryImpl.js'
import { AnnouncementRepositoryImpl } from '@/domains/announcement/infrastructure/repository/AnnouncementRepositoryImpl.js'
import { BcryptPasswordHasher } from '@/domains/auth/_sharedAuth/infrastructure/security/BcryptPasswordHasher.js'
import { AppleCredentialRepositoryImpl } from '@/domains/auth/oauth/infrastructure/repository/AppleCredentialRepositoryImpl.js'
import { GoogleCredentialRepositoryImpl } from '@/domains/auth/oauth/infrastructure/repository/GoogleCredentialRepositoryImpl.js'
import { LineCredentialRepositoryImpl } from '@/domains/auth/oauth/infrastructure/repository/LineCredentialRepositoryImpl.js'
import { PasswordCredentialRepositoryImpl } from '@/domains/auth/password/infrastructure/repository/PasswordCredentialRepositoryImpl.js'
import { AuthSecurityStateRepositoryImpl } from '@/domains/auth/security/infrastructure/repository/AuthSecurityStateRepositoryImpl.js'
import { CommunityAuditLogRepositoryImpl } from '@/domains/community/auditLog/infrastructure/repository/CommunityAuditLogRepositoryImpl.js'
import { CommunityMembershipRepositoryImpl } from '@/domains/community/infrastructure/repository/CommunityMembershipRepositoryImpl.js'
import { CommunityRepositoryImpl } from '@/domains/community/infrastructure/repository/CommunityRepositoryImpl.js'
import { InviteTokenRepositoryImpl } from '@/domains/community/invite/infrastructure/repository/InviteTokenRepositoryImpl.js'
import { PollRepositoryImpl } from '@/domains/poll/infrastructure/repository/PollRepositoryImpl.js'
import { PollVoteRepositoryImpl } from '@/domains/poll/infrastructure/repository/PollVoteRepositoryImpl.js'
import { CommunityWebhookConfigRepositoryImpl } from '@/domains/webhook/infrastructure/repository/CommunityWebhookConfigRepositoryImpl.js'

import { UserRepositoryImpl } from '@/domains/user/infrastructure/repository/UserRepositoryImpl.js'
import { RevenueCatBillingService } from '@/integration/billing/RevenueCatBillingService.js'
import { IntegrationEventFactory } from '@/integration/IntegrationEventFactory.js'
import { AppleOAuthProviderClient } from '@/integration/oauth/AppleOAuthProviderClient.js'
import { GoogleOAuthProviderClient } from '@/integration/oauth/GoogleOAuthProviderClient.js'
import type { IOAuthProviderClient } from '@/integration/oauth/IOAuthProviderClient.js'
import { LineOAuthProviderClient } from '@/integration/oauth/LineOAuthProviderClient.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'


/**
 * テスト用にオーバーライドできるOAuthプロバイダークライアント
 * setOAuthProviderClients() でFakeクライアントを注入可能
 */
let oauthProviderClientsOverride: Record<AuthMethod, IOAuthProviderClient | undefined> | null = null

export const usecaseFactory = {
    /**
     * テスト用: OAuthプロバイダークライアントをオーバーライド
     */
    setOAuthProviderClients(clients: Record<AuthMethod, IOAuthProviderClient | undefined> | null): void {
        oauthProviderClientsOverride = clients
    },
    createSignInPasswordUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const unitOfWork = new PrismaUnitOfWork<SignInPasswordUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            credential: new PasswordCredentialRepositoryImpl(tx),
            authSecurityState: new AuthSecurityStateRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))

        return new SignInPasswordUserUseCase(
            new BcryptPasswordHasher(),
            unitOfWork,
            new IntegrationEventFactory(),
            new OutboxEventFactory(),
            ApplicationEventBootstrap.getEventBus(),
            new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret')
        )
    },

    createSignUpUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )

        const unitOfWork = new PrismaUnitOfWork<SignUpUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            credential: new PasswordCredentialRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))

        return new SignUpUserUseCase(
            new BcryptPasswordHasher(),
            new UuidGenerator(),
            unitOfWork,
            registerUserService,
            new DomainEventFlusher(DomainEventBootstrap.getEventBus()),
            ApplicationEventBootstrap.getEventBus()
        )
    },

    createSignInOAuthUserUseCase() {
        DomainEventBootstrap.bootstrap()
        ApplicationEventBootstrap.bootstrap()

        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const registerUserService = new RegisterUserService(
            integrationEventFactory,
            outboxEventFactory
        )

        const unitOfWork = new PrismaUnitOfWork<SignInOAuthUserTxRepositories>((tx) => ({
            user: new UserRepositoryImpl(tx),
            authSecurityState: new AuthSecurityStateRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
            googleCredential: new GoogleCredentialRepositoryImpl(tx),
            lineCredential: new LineCredentialRepositoryImpl(tx),
            appleCredential: new AppleCredentialRepositoryImpl(tx),
        }))

        return new SignInOAuthUserUseCase(
            new UuidGenerator(),
            unitOfWork,
            registerUserService,
            integrationEventFactory,
            outboxEventFactory,
            ApplicationEventBootstrap.getEventBus(),
            new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret'),
            oauthProviderClientsOverride ?? {
                password: undefined,
                google: new GoogleOAuthProviderClient(),
                line: new LineOAuthProviderClient(),
                apple: new AppleOAuthProviderClient(),
            }
        )
    },

    // ---- Community ----

    createCreateCommunityUseCase() {
        DomainEventBootstrap.bootstrap()
        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const unitOfWork = new PrismaUnitOfWork<CreateCommunityTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            user: new UserRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
            tx,
        }))
        return new CreateCommunityUseCase(
            new UuidGenerator(),
            unitOfWork,
            integrationEventFactory,
            outboxEventFactory,
            new DomainEventFlusher(DomainEventBootstrap.getEventBus()),
        )
    },

    createCreateSubCommunityUseCase() {
        DomainEventBootstrap.bootstrap()
        const integrationEventFactory = new IntegrationEventFactory()
        const outboxEventFactory = new OutboxEventFactory()
        const unitOfWork = new PrismaUnitOfWork<CreateSubCommunityTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            user: new UserRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        return new CreateSubCommunityUseCase(
            new UuidGenerator(),
            unitOfWork,
            integrationEventFactory,
            outboxEventFactory,
            new DomainEventFlusher(DomainEventBootstrap.getEventBus()),
        )
    },

    createFindCommunityUseCase() {
        return new FindCommunityUseCase(new CommunityRepositoryImpl(prisma))
    },

    createListCommunitiesUseCase() {
        return new ListCommunitiesUseCase(
            new CommunityRepositoryImpl(prisma),
        )
    },

    // ---- Phase 2.5: 検索・参加 ----

    createSearchCommunitiesUseCase() {
        return new SearchCommunitiesUseCase(new CommunityRepositoryImpl(prisma))
    },

    createFindPublicCommunityUseCase() {
        return new FindPublicCommunityUseCase(new CommunityRepositoryImpl(prisma))
    },

    createJoinCommunityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<JoinCommunityTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new JoinCommunityUseCase(new UuidGenerator(), unitOfWork)
    },

    createRequestJoinCommunityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<RequestJoinCommunityTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            tx,
        }))
        return new RequestJoinCommunityUseCase(unitOfWork)
    },

    createUpdateCommunityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<UpdateCommunityTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            auditLog: new CommunityAuditLogRepositoryImpl(tx),
        }))
        return new UpdateCommunityUseCase(unitOfWork)
    },

    createSoftDeleteCommunityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<SoftDeleteCommunityTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new SoftDeleteCommunityUseCase(unitOfWork)
    },

    // ---- Membership ----

    createAddMemberUseCase() {
        const unitOfWork = new PrismaUnitOfWork<AddMemberTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new AddMemberUseCase(new UuidGenerator(), unitOfWork)
    },

    createChangeMemberRoleUseCase() {
        const unitOfWork = new PrismaUnitOfWork<ChangeMemberRoleTxRepositories>((tx) => ({
            membership: new CommunityMembershipRepositoryImpl(tx),
            community: new CommunityRepositoryImpl(tx),
            user: new UserRepositoryImpl(tx),
            auditLog: new CommunityAuditLogRepositoryImpl(tx),
        }))
        return new ChangeMemberRoleUseCase(unitOfWork)
    },

    createLeaveCommunityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<LeaveCommunityTxRepositories>((tx) => ({
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new LeaveCommunityUseCase(unitOfWork)
    },

    createListMembersUseCase() {
        return new ListMembersUseCase(
            new CommunityMembershipRepositoryImpl(prisma),
            new UserRepositoryImpl(prisma),
        )
    },

    // ---- Activity ----

    createCreateActivityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CreateActivityTxRepositories>((tx) => ({
            activity: new ActivityRepositoryImpl(tx),
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            schedule: new ScheduleRepositoryImpl(tx),
        }))
        return new CreateActivityUseCase(new UuidGenerator(), unitOfWork)
    },

    createFindActivityUseCase() {
        return new FindActivityUseCase(
            new ActivityRepositoryImpl(prisma),
            new UserRepositoryImpl(prisma),
        )
    },

    createListActivitiesUseCase() {
        return new ListActivitiesUseCase(
            new ActivityRepositoryImpl(prisma),
            new ScheduleRepositoryImpl(prisma),
        )
    },

    createUpdateActivityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<UpdateActivityTxRepositories>((tx) => ({
            activity: new ActivityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new UpdateActivityUseCase(unitOfWork)
    },

    createSoftDeleteActivityUseCase() {
        const unitOfWork = new PrismaUnitOfWork<SoftDeleteActivityTxRepositories>((tx) => ({
            activity: new ActivityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new SoftDeleteActivityUseCase(unitOfWork)
    },

    // ---- Schedule ----

    createCreateScheduleUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CreateScheduleTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            activity: new ActivityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new CreateScheduleUseCase(new UuidGenerator(), unitOfWork)
    },

    createFindScheduleUseCase() {
        return new FindScheduleUseCase(
            new ScheduleRepositoryImpl(prisma),
            new ActivityRepositoryImpl(prisma),
            new ParticipationRepositoryImpl(prisma),
            new WaitlistEntryRepositoryImpl(prisma),
        )
    },

    createListSchedulesUseCase() {
        return new ListSchedulesUseCase(new ScheduleRepositoryImpl(prisma), new ParticipationRepositoryImpl(prisma))
    },
    createListUserSchedulesUseCase() {
        return new ListUserSchedulesUseCase(new CommunityMembershipRepositoryImpl(prisma), prisma)
    },

    createUpdateScheduleUseCase() {
        const unitOfWork = new PrismaUnitOfWork<UpdateScheduleTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            activity: new ActivityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new UpdateScheduleUseCase(unitOfWork)
    },

    createCancelScheduleUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CancelScheduleTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            activity: new ActivityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            participation: new ParticipationRepositoryImpl(tx),
            notification: new NotificationRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        const notificationService = new NotificationService(RealtimeEmitterBootstrap.getEmitter())
        return new CancelScheduleUseCase(unitOfWork, notificationService)
    },

    // ---- Participation + Waitlist ----

    createAttendScheduleUseCase() {
        const unitOfWork = new PrismaUnitOfWork<AttendScheduleTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            participation: new ParticipationRepositoryImpl(tx),
        }))
        return new AttendScheduleUseCase(new UuidGenerator(), unitOfWork)
    },

    createCancelParticipationUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CancelParticipationTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            participation: new ParticipationRepositoryImpl(tx),
            waitlist: new WaitlistEntryRepositoryImpl(tx),
            notification: new NotificationRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        const notificationService = new NotificationService(RealtimeEmitterBootstrap.getEmitter())
        return new CancelParticipationUseCase(new UuidGenerator(), unitOfWork, notificationService, prisma)
    },

    createRemoveParticipantByAdminUseCase() {
        const unitOfWork = new PrismaUnitOfWork<RemoveParticipantByAdminTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            activity: new ActivityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            participation: new ParticipationRepositoryImpl(tx),
            waitlist: new WaitlistEntryRepositoryImpl(tx),
            notification: new NotificationRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        const notificationService = new NotificationService(RealtimeEmitterBootstrap.getEmitter())
        return new RemoveParticipantByAdminUseCase(new UuidGenerator(), unitOfWork, notificationService)
    },

    createJoinWaitlistUseCase() {
        const unitOfWork = new PrismaUnitOfWork<JoinWaitlistTxRepositories>((tx) => ({
            schedule: new ScheduleRepositoryImpl(tx),
            participation: new ParticipationRepositoryImpl(tx),
            waitlist: new WaitlistEntryRepositoryImpl(tx),
        }))
        return new JoinWaitlistUseCase(new UuidGenerator(), unitOfWork)
    },

    createCancelWaitlistUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CancelWaitlistTxRepositories>((tx) => ({
            waitlist: new WaitlistEntryRepositoryImpl(tx),
        }))
        return new CancelWaitlistUseCase(unitOfWork)
    },

    createListParticipationsUseCase() {
        return new ListParticipationsUseCase(
            new ParticipationRepositoryImpl(prisma),
            new UserRepositoryImpl(prisma),
        )
    },

    createListWaitlistEntriesUseCase() {
        return new ListWaitlistEntriesUseCase(
            new WaitlistEntryRepositoryImpl(prisma),
            new UserRepositoryImpl(prisma),
        )
    },

    // ---- Announcement ----
    createCreateAnnouncementUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CreateAnnouncementTxRepositories>((tx) => ({
            announcement: new AnnouncementRepositoryImpl(tx),
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            notification: new NotificationRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        const notificationService = new NotificationService(RealtimeEmitterBootstrap.getEmitter())
        return new CreateAnnouncementUseCase(new UuidGenerator(), unitOfWork, notificationService, new CommunityWebhookConfigRepositoryImpl())
    },

    createFindAnnouncementUseCase() {
        return new FindAnnouncementUseCase(new AnnouncementRepositoryImpl(prisma))
    },

    createListAnnouncementsUseCase() {
        return new ListAnnouncementsUseCase(
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementReadRepositoryImpl(prisma),
            new AnnouncementLikeRepositoryImpl(prisma),
            new AnnouncementCommentRepositoryImpl(prisma),
            new AnnouncementBookmarkRepositoryImpl(prisma),
        )
    },

    createDeleteAnnouncementUseCase() {
        const unitOfWork = new PrismaUnitOfWork<DeleteAnnouncementTxRepositories>((tx) => ({
            announcement: new AnnouncementRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new DeleteAnnouncementUseCase(unitOfWork)
    },

    // ---- Phase 3 (3-2): お知らせ編集 ----
    createUpdateAnnouncementUseCase() {
        const unitOfWork = new PrismaUnitOfWork<UpdateAnnouncementTxRepositories>((tx) => ({
            announcement: new AnnouncementRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
        }))
        return new UpdateAnnouncementUseCase(unitOfWork)
    },

    createMarkAnnouncementAsReadUseCase() {
        return new MarkAnnouncementAsReadUseCase(
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementReadRepositoryImpl(prisma),
        )
    },

    createGetAnnouncementFeedUseCase() {
        return new GetAnnouncementFeedUseCase(
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementReadRepositoryImpl(prisma),
            new CommunityMembershipRepositoryImpl(prisma),
            new AnnouncementLikeRepositoryImpl(prisma),
            new AnnouncementCommentRepositoryImpl(prisma),
            new AnnouncementBookmarkRepositoryImpl(prisma),
        )
    },

    // ---- UBL-1: いいね ----
    createToggleAnnouncementLikeUseCase() {
        return new ToggleAnnouncementLikeUseCase(
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementLikeRepositoryImpl(prisma),
        )
    },

    // ---- UBL-2: コメント ----
    createCreateAnnouncementCommentUseCase() {
        return new CreateAnnouncementCommentUseCase(
            new UuidGenerator(),
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementCommentRepositoryImpl(prisma),
        )
    },

    createListAnnouncementCommentsUseCase() {
        return new ListAnnouncementCommentsUseCase(
            new AnnouncementCommentRepositoryImpl(prisma),
        )
    },

    createDeleteAnnouncementCommentUseCase() {
        return new DeleteAnnouncementCommentUseCase(
            new AnnouncementCommentRepositoryImpl(prisma),
        )
    },

    // ---- UBL-4: 検索 ----
    createSearchAnnouncementsUseCase() {
        return new SearchAnnouncementsUseCase(
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementReadRepositoryImpl(prisma),
            new CommunityMembershipRepositoryImpl(prisma),
            new AnnouncementLikeRepositoryImpl(prisma),
            new AnnouncementCommentRepositoryImpl(prisma),
            new AnnouncementBookmarkRepositoryImpl(prisma),
        )
    },

    // ---- Phase 3 (3-1): ブックマーク ----
    createToggleAnnouncementBookmarkUseCase() {
        return new ToggleAnnouncementBookmarkUseCase(
            new AnnouncementRepositoryImpl(prisma),
            new AnnouncementBookmarkRepositoryImpl(prisma),
        )
    },

    // ---- UBL-8: 支払 ----
    createReportPaymentUseCase() {
        return new ReportPaymentUseCase(new ParticipationRepositoryImpl(prisma))
    },

    createConfirmPaymentUseCase() {
        return new ConfirmPaymentUseCase(new ParticipationRepositoryImpl(prisma))
    },

    // ---- UBL-6: アルバム ----
    createCreateAlbumUseCase() {
        return new CreateAlbumUseCase(new UuidGenerator(), new AlbumRepositoryImpl(prisma))
    },

    createListAlbumsUseCase() {
        return new ListAlbumsUseCase(new AlbumRepositoryImpl(prisma))
    },

    createAddAlbumPhotoUseCase() {
        return new AddAlbumPhotoUseCase(
            new UuidGenerator(),
            new AlbumRepositoryImpl(prisma),
            new AlbumPhotoRepositoryImpl(prisma),
        )
    },

    createListAlbumPhotosUseCase() {
        return new ListAlbumPhotosUseCase(new AlbumPhotoRepositoryImpl(prisma))
    },

    createDeleteAlbumPhotoUseCase() {
        return new DeleteAlbumPhotoUseCase(new AlbumPhotoRepositoryImpl(prisma))
    },

    // ---- UBL-32: マイページ ----

    createGetUserProfileUseCase() {
        return new GetUserProfileUseCase(new UserRepositoryImpl(prisma))
    },

    createUpdateUserProfileUseCase() {
        return new UpdateUserProfileUseCase(new UserRepositoryImpl(prisma))
    },

    // ---- UBL-10: コミュニティ設定 ----

    createRemoveMemberUseCase() {
        const unitOfWork = new PrismaUnitOfWork<RemoveMemberTxRepositories>((tx) => ({
            membership: new CommunityMembershipRepositoryImpl(tx),
            auditLog: new CommunityAuditLogRepositoryImpl(tx),
        }))
        return new RemoveMemberUseCase(unitOfWork)
    },

    createListCommunityAuditLogsUseCase() {
        return new ListCommunityAuditLogsUseCase(
            new CommunityAuditLogRepositoryImpl(prisma),
        )
    },

    // ---- UBL-11: 招待 ----

    createGenerateInviteTokenUseCase() {
        return new GenerateInviteTokenUseCase(
            new UuidGenerator(),
            new CommunityMembershipRepositoryImpl(prisma),
            new InviteTokenRepositoryImpl(prisma),
        )
    },

    createAcceptInviteUseCase() {
        const unitOfWork = new PrismaUnitOfWork<AcceptInviteTxRepositories>((tx) => ({
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            inviteToken: new InviteTokenRepositoryImpl(tx),
            auditLog: new CommunityAuditLogRepositoryImpl(tx),
            notification: new NotificationRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        const notificationService = new NotificationService(RealtimeEmitterBootstrap.getEmitter())
        return new AcceptInviteUseCase(new UuidGenerator(), unitOfWork, notificationService)
    },

    // ---- Billing (RevenueCat) ----

    createHandleRevenueCatWebhookUseCase() {
        return new HandleRevenueCatWebhookUseCase(
            new RevenueCatBillingService(),
            new UserRepositoryImpl(prisma),
        )
    },

    // ---- Phase 4: Analytics & Export (UBL-17〜22) ----

    createGetCommunityStatsUseCase() {
        return new GetCommunityStatsUseCase(prisma)
    },

    createGetParticipationTrendUseCase() {
        return new GetParticipationTrendUseCase(prisma)
    },

    createGetAbsenceReportUseCase() {
        return new GetAbsenceReportUseCase(prisma)
    },

    createExportParticipationCsvUseCase() {
        return new ExportParticipationCsvUseCase(prisma)
    },

    createExportAccountingUseCase() {
        return new ExportAccountingUseCase(prisma)
    },

    createExportCalendarUseCase() {
        return new ExportCalendarUseCase(prisma)
    },

    // ---- UBL-34: 投票/アンケート (Poll) ----

    createCreatePollUseCase() {
        const unitOfWork = new PrismaUnitOfWork<CreatePollTxRepositories>((tx) => ({
            poll: new PollRepositoryImpl(tx),
            community: new CommunityRepositoryImpl(tx),
            membership: new CommunityMembershipRepositoryImpl(tx),
            notification: new NotificationRepositoryImpl(tx),
            outbox: new OutboxRepository(tx),
        }))
        const notificationService = new NotificationService(RealtimeEmitterBootstrap.getEmitter())
        return new CreatePollUseCase(new UuidGenerator(), unitOfWork, notificationService, new CommunityWebhookConfigRepositoryImpl())
    },

    createCastVoteUseCase() {
        return new CastVoteUseCase(
            new UuidGenerator(),
            new PollRepositoryImpl(prisma),
            new PollVoteRepositoryImpl(prisma),
            new CommunityMembershipRepositoryImpl(prisma),
        )
    },

    createGetPollResultUseCase() {
        return new GetPollResultUseCase(
            new PollRepositoryImpl(prisma),
            new PollVoteRepositoryImpl(prisma),
        )
    },

    createListPollsUseCase() {
        return new ListPollsUseCase(
            new PollRepositoryImpl(prisma),
            new PollVoteRepositoryImpl(prisma),
        )
    },

    createDeletePollUseCase() {
        return new DeletePollUseCase(
            new PollRepositoryImpl(prisma),
            new CommunityMembershipRepositoryImpl(prisma),
        )
    },

    // ---- UBL-29: Webhook 設定 ----

    createUpsertWebhookConfigUseCase() {
        return new UpsertWebhookConfigUseCase(
            new CommunityWebhookConfigRepositoryImpl(),
            new CommunityMembershipRepositoryImpl(prisma),
        )
    },

    createGetWebhookConfigsUseCase() {
        return new GetWebhookConfigsUseCase(
            new CommunityWebhookConfigRepositoryImpl(),
            new CommunityMembershipRepositoryImpl(prisma),
        )
    },

    createDeleteWebhookConfigUseCase() {
        return new DeleteWebhookConfigUseCase(
            new CommunityWebhookConfigRepositoryImpl(),
            new CommunityMembershipRepositoryImpl(prisma),
        )
    },
}
