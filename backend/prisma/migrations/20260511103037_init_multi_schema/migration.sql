-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "activity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "announcement";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "community";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "master";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "media";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "messaging";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "outbox";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "support";

-- CreateTable
CREATE TABLE "outbox"."outbox_events" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "routing_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox"."outbox_retry_policies" (
    "routing_key" TEXT NOT NULL,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "base_interval" INTEGER NOT NULL DEFAULT 3000,
    "max_interval" INTEGER NOT NULL DEFAULT 60000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_retry_policies_pkey" PRIMARY KEY ("routing_key")
);

-- CreateTable
CREATE TABLE "auth"."auth_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "auth_method" TEXT NOT NULL,
    "detail" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox"."outbox_dead_letters" (
    "id" TEXT NOT NULL,
    "outbox_event_id" TEXT NOT NULL,
    "routing_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error_message" TEXT,
    "error_stack" TEXT,
    "error_type" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_http_status" INTEGER,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_dead_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."activities" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "default_place_id" TEXT,
    "default_location_custom" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "default_start_time" TEXT,
    "default_end_time" TEXT,
    "default_participation_fee" INTEGER,
    "default_visitor_fee" INTEGER,
    "default_capacity" INTEGER,
    "allow_visitor_waitlist" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "recurrence_rule" TEXT,
    "organizer_user_id" TEXT,
    "created_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."place_masters" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "normalized_name" VARCHAR(200) NOT NULL,
    "normalized_address" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50),
    "source" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(100) NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."schedules" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "capacity" INTEGER,
    "participation_fee" INTEGER NOT NULL DEFAULT 0,
    "visitor_fee" INTEGER,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "meeting_url" TEXT,
    "visibility" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."participations" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "user_id" TEXT,
    "is_visitor" BOOLEAN NOT NULL DEFAULT false,
    "visitor_name" VARCHAR(50),
    "visitor_level" INTEGER,
    "added_by" TEXT,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."payments" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "participation_id" TEXT,
    "user_id" TEXT,
    "payment_method" TEXT,
    "display_name" VARCHAR(100),
    "amount" INTEGER NOT NULL,
    "fee_amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripe_payment_intent_id" TEXT,
    "payment_reported_at" TIMESTAMP(3),
    "payment_confirmed_at" TIMESTAMP(3),
    "payment_confirmed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."waitlist_entries" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "user_id" TEXT,
    "is_visitor" BOOLEAN NOT NULL DEFAULT false,
    "visitor_name" TEXT,
    "added_by" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."users" (
    "id" TEXT NOT NULL,
    "display_name" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "system_role" TEXT NOT NULL DEFAULT 'USER',
    "email" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "biography" TEXT,
    "notification_setting" JSONB NOT NULL,
    "locale" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_withdrawals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "free_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."auth_security_states" (
    "user_id" TEXT NOT NULL,
    "auth_method" TEXT,
    "last_login_at" TIMESTAMP(3),
    "failed_sign_in_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_security_states_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth"."password_credentials" (
    "user_id" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth"."google_credentials" (
    "user_id" TEXT NOT NULL,
    "google_uid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "auth"."line_credentials" (
    "user_id" TEXT NOT NULL,
    "line_uid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "auth"."apple_credentials" (
    "user_id" TEXT NOT NULL,
    "apple_uid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "community"."communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "parent_id" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'FREE',
    "created_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "join_method" TEXT NOT NULL DEFAULT 'FREE_JOIN',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "max_members" INTEGER,
    "activity_frequency" TEXT,
    "target_gender" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "age_min" INTEGER,
    "age_max" INTEGER,
    "recommended_level_min" INTEGER,
    "recommended_level_max" INTEGER,
    "pay_pay_id" TEXT,
    "enabled_payment_methods" TEXT[] DEFAULT ARRAY['CASH']::TEXT[],
    "stripe_account_id" TEXT,
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "cancellation_alert_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_memberships" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "level" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_locations" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "station" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_join_requests" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."announcements" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "activity_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."announcement_reads" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."announcement_likes" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."announcement_comments" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."announcement_attachments" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."announcement_bookmarks" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."albums" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."album_photos" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."plan_feature_policies" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_feature_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."plan_limit_policies" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "limit_key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_limit_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."community_grade_feature_policies" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_grade_feature_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."community_grade_limit_policies" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "limit_key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_grade_limit_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_audit_logs" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "before" TEXT,
    "after" TEXT,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."participation_audit_logs" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "payment_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."waitlist_audit_logs" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."invite_tokens" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."invite_token_usages" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_token_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."chat_channels" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "community_id" TEXT,
    "activity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."messages" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "parent_message_id" TEXT,
    "content" TEXT NOT NULL,
    "mentions" JSONB NOT NULL DEFAULT '[]',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."message_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."dm_participants" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."stamps" (
    "id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stamps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."message_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stamp_id" TEXT,
    "emoji" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."category_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."category_match_formats" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "players_per_group" INTEGER NOT NULL,
    "groups_per_court" INTEGER NOT NULL DEFAULT 2,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_match_formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."matching_results" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "rounds" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matching_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."participation_level_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participation_level_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_categories" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "community_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_participation_levels" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,

    CONSTRAINT "community_participation_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_activity_days" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,

    CONSTRAINT "community_activity_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_tags" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "community_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."polls" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "announcement_id" TEXT,
    "question" TEXT NOT NULL,
    "is_multiple_choice" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."poll_options" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement"."poll_votes" (
    "id" TEXT NOT NULL,
    "poll_option_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_webhook_configs" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_webhook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_bookmarks" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."expense_categories" (
    "id" TEXT NOT NULL,
    "community_id" TEXT,
    "name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."expenses" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."plan_masters" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price" INTEGER,
    "one_time_price" INTEGER,
    "revenuecat_product_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."channel_read_states" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."inquiry_category_masters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label_i18n" JSONB NOT NULL,
    "related_help_category_slug" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_anonymous_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_category_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."inquiries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "contact_email" TEXT,
    "category_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "assignee_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."inquiry_messages" (
    "id" TEXT NOT NULL,
    "inquiry_id" TEXT NOT NULL,
    "author_type" TEXT NOT NULL,
    "author_user_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."inquiry_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "scan_status" TEXT NOT NULL DEFAULT 'PENDING',
    "scanned_at" TIMESTAMP(3),
    "is_purged" BOOLEAN NOT NULL DEFAULT false,
    "purged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."help_feedbacks" (
    "id" TEXT NOT NULL,
    "article_slug" VARCHAR(200) NOT NULL,
    "category_slug" VARCHAR(100) NOT NULL,
    "user_id" TEXT,
    "helpful" BOOLEAN NOT NULL,
    "comment" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotency_key_key" ON "outbox"."outbox_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "outbox_events_status_next_retry_at_idx" ON "outbox"."outbox_events"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_occurred_at_idx" ON "auth"."auth_audit_logs"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "outbox_dead_letters_failed_at_idx" ON "outbox"."outbox_dead_letters"("failed_at");

-- CreateIndex
CREATE INDEX "outbox_dead_letters_routing_key_idx" ON "outbox"."outbox_dead_letters"("routing_key");

-- CreateIndex
CREATE INDEX "activities_community_id_idx" ON "activity"."activities"("community_id");

-- CreateIndex
CREATE INDEX "activities_created_by_idx" ON "activity"."activities"("created_by");

-- CreateIndex
CREATE INDEX "activities_organizer_user_id_idx" ON "activity"."activities"("organizer_user_id");

-- CreateIndex
CREATE INDEX "activities_default_place_id_idx" ON "activity"."activities"("default_place_id");

-- CreateIndex
CREATE INDEX "place_masters_is_active_usage_count_idx" ON "master"."place_masters"("is_active", "usage_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "place_masters_source_source_id_key" ON "master"."place_masters"("source", "source_id");

-- CreateIndex
CREATE INDEX "schedules_activity_id_idx" ON "activity"."schedules"("activity_id");

-- CreateIndex
CREATE INDEX "schedules_date_idx" ON "activity"."schedules"("date");

-- CreateIndex
CREATE INDEX "participations_schedule_id_idx" ON "activity"."participations"("schedule_id");

-- CreateIndex
CREATE INDEX "participations_user_id_idx" ON "activity"."participations"("user_id");

-- CreateIndex
CREATE INDEX "payments_schedule_id_user_id_idx" ON "billing"."payments"("schedule_id", "user_id");

-- CreateIndex
CREATE INDEX "payments_participation_id_idx" ON "billing"."payments"("participation_id");

-- CreateIndex
CREATE INDEX "payments_stripe_payment_intent_id_idx" ON "billing"."payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "waitlist_entries_schedule_id_user_id_idx" ON "activity"."waitlist_entries"("schedule_id", "user_id");

-- CreateIndex
CREATE INDEX "waitlist_entries_schedule_id_registered_at_idx" ON "activity"."waitlist_entries"("schedule_id", "registered_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_withdrawals_user_id_key" ON "auth"."user_withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "auth_security_states_locked_until_idx" ON "auth"."auth_security_states"("locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "google_credentials_user_id_key" ON "auth"."google_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_credentials_google_uid_key" ON "auth"."google_credentials"("google_uid");

-- CreateIndex
CREATE UNIQUE INDEX "line_credentials_user_id_key" ON "auth"."line_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_credentials_line_uid_key" ON "auth"."line_credentials"("line_uid");

-- CreateIndex
CREATE UNIQUE INDEX "apple_credentials_user_id_key" ON "auth"."apple_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "apple_credentials_apple_uid_key" ON "auth"."apple_credentials"("apple_uid");

-- CreateIndex
CREATE INDEX "communities_created_by_idx" ON "community"."communities"("created_by");

-- CreateIndex
CREATE INDEX "communities_parent_id_idx" ON "community"."communities"("parent_id");

-- CreateIndex
CREATE INDEX "community_memberships_user_id_idx" ON "community"."community_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_community_id_user_id_key" ON "community"."community_memberships"("community_id", "user_id");

-- CreateIndex
CREATE INDEX "community_locations_community_id_idx" ON "community"."community_locations"("community_id");

-- CreateIndex
CREATE INDEX "community_join_requests_community_id_idx" ON "community"."community_join_requests"("community_id");

-- CreateIndex
CREATE INDEX "community_join_requests_user_id_idx" ON "community"."community_join_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_join_requests_community_id_user_id_status_key" ON "community"."community_join_requests"("community_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "announcements_community_id_idx" ON "announcement"."announcements"("community_id");

-- CreateIndex
CREATE INDEX "announcements_author_id_idx" ON "announcement"."announcements"("author_id");

-- CreateIndex
CREATE INDEX "announcements_activity_id_idx" ON "announcement"."announcements"("activity_id");

-- CreateIndex
CREATE INDEX "announcement_reads_user_id_idx" ON "announcement"."announcement_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_user_id_key" ON "announcement"."announcement_reads"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "announcement_likes_user_id_idx" ON "announcement"."announcement_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_likes_announcement_id_user_id_key" ON "announcement"."announcement_likes"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "announcement_comments_announcement_id_created_at_idx" ON "announcement"."announcement_comments"("announcement_id", "created_at");

-- CreateIndex
CREATE INDEX "announcement_comments_user_id_idx" ON "announcement"."announcement_comments"("user_id");

-- CreateIndex
CREATE INDEX "announcement_attachments_announcement_id_idx" ON "announcement"."announcement_attachments"("announcement_id");

-- CreateIndex
CREATE INDEX "announcement_bookmarks_user_id_idx" ON "announcement"."announcement_bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_bookmarks_announcement_id_user_id_key" ON "announcement"."announcement_bookmarks"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "albums_community_id_idx" ON "media"."albums"("community_id");

-- CreateIndex
CREATE INDEX "album_photos_album_id_idx" ON "media"."album_photos"("album_id");

-- CreateIndex
CREATE INDEX "plan_feature_policies_plan_idx" ON "master"."plan_feature_policies"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "plan_feature_policies_plan_feature_key" ON "master"."plan_feature_policies"("plan", "feature");

-- CreateIndex
CREATE INDEX "plan_limit_policies_plan_idx" ON "master"."plan_limit_policies"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limit_policies_plan_limit_key_key" ON "master"."plan_limit_policies"("plan", "limit_key");

-- CreateIndex
CREATE INDEX "community_grade_feature_policies_grade_idx" ON "master"."community_grade_feature_policies"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "community_grade_feature_policies_grade_feature_key" ON "master"."community_grade_feature_policies"("grade", "feature");

-- CreateIndex
CREATE INDEX "community_grade_limit_policies_grade_idx" ON "master"."community_grade_limit_policies"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "community_grade_limit_policies_grade_limit_key_key" ON "master"."community_grade_limit_policies"("grade", "limit_key");

-- CreateIndex
CREATE INDEX "community_audit_logs_community_id_created_at_idx" ON "community"."community_audit_logs"("community_id", "created_at");

-- CreateIndex
CREATE INDEX "participation_audit_logs_schedule_id_created_at_idx" ON "activity"."participation_audit_logs"("schedule_id", "created_at");

-- CreateIndex
CREATE INDEX "participation_audit_logs_user_id_created_at_idx" ON "activity"."participation_audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "waitlist_audit_logs_schedule_id_created_at_idx" ON "activity"."waitlist_audit_logs"("schedule_id", "created_at");

-- CreateIndex
CREATE INDEX "waitlist_audit_logs_user_id_created_at_idx" ON "activity"."waitlist_audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "community"."invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_tokens_community_id_idx" ON "community"."invite_tokens"("community_id");

-- CreateIndex
CREATE INDEX "invite_tokens_token_idx" ON "community"."invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_token_usages_token_id_idx" ON "community"."invite_token_usages"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "invite_token_usages_token_id_user_id_key" ON "community"."invite_token_usages"("token_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channels_community_id_key" ON "messaging"."chat_channels"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channels_activity_id_key" ON "messaging"."chat_channels"("activity_id");

-- CreateIndex
CREATE INDEX "chat_channels_type_idx" ON "messaging"."chat_channels"("type");

-- CreateIndex
CREATE INDEX "messages_channel_id_created_at_idx" ON "messaging"."messages"("channel_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_parent_message_id_idx" ON "messaging"."messages"("parent_message_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messaging"."messages"("sender_id");

-- CreateIndex
CREATE INDEX "message_attachments_message_id_idx" ON "messaging"."message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "dm_participants_user_id_idx" ON "messaging"."dm_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dm_participants_channel_id_user_id_key" ON "messaging"."dm_participants"("channel_id", "user_id");

-- CreateIndex
CREATE INDEX "stamps_created_by_user_id_idx" ON "messaging"."stamps"("created_by_user_id");

-- CreateIndex
CREATE INDEX "message_reactions_message_id_idx" ON "messaging"."message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "message_reactions_stamp_id_idx" ON "messaging"."message_reactions"("stamp_id");

-- CreateIndex
CREATE INDEX "message_reactions_user_id_idx" ON "messaging"."message_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_stamp_id_key" ON "messaging"."message_reactions"("message_id", "user_id", "stamp_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_emoji_key" ON "messaging"."message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notification"."notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "notification"."device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "notification"."device_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_masters_name_key" ON "master"."category_masters"("name");

-- CreateIndex
CREATE INDEX "category_masters_sort_order_idx" ON "master"."category_masters"("sort_order");

-- CreateIndex
CREATE INDEX "category_match_formats_category_id_sort_order_idx" ON "master"."category_match_formats"("category_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "category_match_formats_category_id_name_key" ON "master"."category_match_formats"("category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "matching_results_schedule_id_key" ON "support"."matching_results"("schedule_id");

-- CreateIndex
CREATE INDEX "matching_results_created_by_idx" ON "support"."matching_results"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "participation_level_masters_name_key" ON "master"."participation_level_masters"("name");

-- CreateIndex
CREATE INDEX "participation_level_masters_sort_order_idx" ON "master"."participation_level_masters"("sort_order");

-- CreateIndex
CREATE INDEX "community_categories_category_id_idx" ON "community"."community_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_categories_community_id_category_id_key" ON "community"."community_categories"("community_id", "category_id");

-- CreateIndex
CREATE INDEX "community_participation_levels_level_id_idx" ON "community"."community_participation_levels"("level_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_participation_levels_community_id_level_id_key" ON "community"."community_participation_levels"("community_id", "level_id");

-- CreateIndex
CREATE INDEX "community_activity_days_community_id_idx" ON "community"."community_activity_days"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_activity_days_community_id_day_key" ON "community"."community_activity_days"("community_id", "day");

-- CreateIndex
CREATE INDEX "community_tags_community_id_idx" ON "community"."community_tags"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_tags_community_id_tag_key" ON "community"."community_tags"("community_id", "tag");

-- CreateIndex
CREATE INDEX "polls_community_id_idx" ON "announcement"."polls"("community_id");

-- CreateIndex
CREATE INDEX "polls_announcement_id_idx" ON "announcement"."polls"("announcement_id");

-- CreateIndex
CREATE INDEX "polls_created_by_idx" ON "announcement"."polls"("created_by");

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "announcement"."poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_user_id_idx" ON "announcement"."poll_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_option_id_user_id_key" ON "announcement"."poll_votes"("poll_option_id", "user_id");

-- CreateIndex
CREATE INDEX "community_webhook_configs_community_id_idx" ON "community"."community_webhook_configs"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_webhook_configs_community_id_service_key" ON "community"."community_webhook_configs"("community_id", "service");

-- CreateIndex
CREATE INDEX "community_bookmarks_user_id_idx" ON "community"."community_bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_bookmarks_community_id_user_id_key" ON "community"."community_bookmarks"("community_id", "user_id");

-- CreateIndex
CREATE INDEX "expense_categories_community_id_idx" ON "support"."expense_categories"("community_id");

-- CreateIndex
CREATE INDEX "expenses_community_id_idx" ON "support"."expenses"("community_id");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "support"."expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_created_by_idx" ON "support"."expenses"("created_by");

-- CreateIndex
CREATE INDEX "plan_masters_sort_order_idx" ON "master"."plan_masters"("sort_order");

-- CreateIndex
CREATE INDEX "plan_masters_available_from_available_to_idx" ON "master"."plan_masters"("available_from", "available_to");

-- CreateIndex
CREATE INDEX "channel_read_states_user_id_idx" ON "messaging"."channel_read_states"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_read_states_channel_id_user_id_key" ON "messaging"."channel_read_states"("channel_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_category_masters_slug_key" ON "master"."inquiry_category_masters"("slug");

-- CreateIndex
CREATE INDEX "inquiry_category_masters_is_active_sort_order_idx" ON "master"."inquiry_category_masters"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "inquiries_user_id_last_activity_at_idx" ON "support"."inquiries"("user_id", "last_activity_at" DESC);

-- CreateIndex
CREATE INDEX "inquiries_status_last_activity_at_idx" ON "support"."inquiries"("status", "last_activity_at" DESC);

-- CreateIndex
CREATE INDEX "inquiries_category_id_idx" ON "support"."inquiries"("category_id");

-- CreateIndex
CREATE INDEX "inquiries_assignee_user_id_status_idx" ON "support"."inquiries"("assignee_user_id", "status");

-- CreateIndex
CREATE INDEX "inquiry_messages_inquiry_id_created_at_idx" ON "support"."inquiry_messages"("inquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "inquiry_messages_author_user_id_idx" ON "support"."inquiry_messages"("author_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_attachments_storage_key_key" ON "support"."inquiry_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "inquiry_attachments_message_id_idx" ON "support"."inquiry_attachments"("message_id");

-- CreateIndex
CREATE INDEX "inquiry_attachments_scan_status_idx" ON "support"."inquiry_attachments"("scan_status");

-- CreateIndex
CREATE INDEX "inquiry_attachments_is_purged_idx" ON "support"."inquiry_attachments"("is_purged");

-- CreateIndex
CREATE INDEX "help_feedbacks_article_slug_created_at_idx" ON "support"."help_feedbacks"("article_slug", "created_at");

-- CreateIndex
CREATE INDEX "help_feedbacks_category_slug_created_at_idx" ON "support"."help_feedbacks"("category_slug", "created_at");

-- CreateIndex
CREATE INDEX "help_feedbacks_user_id_created_at_idx" ON "support"."help_feedbacks"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "help_feedbacks_user_id_article_slug_key" ON "support"."help_feedbacks"("user_id", "article_slug");

-- AddForeignKey
ALTER TABLE "activity"."activities" ADD CONSTRAINT "activities_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity"."activities" ADD CONSTRAINT "activities_default_place_id_fkey" FOREIGN KEY ("default_place_id") REFERENCES "master"."place_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity"."schedules" ADD CONSTRAINT "schedules_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"."activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity"."participations" ADD CONSTRAINT "participations_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "activity"."schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "activity"."schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_participation_id_fkey" FOREIGN KEY ("participation_id") REFERENCES "activity"."participations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity"."waitlist_entries" ADD CONSTRAINT "waitlist_entries_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "activity"."schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_withdrawals" ADD CONSTRAINT "user_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."auth_security_states" ADD CONSTRAINT "auth_security_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."password_credentials" ADD CONSTRAINT "password_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."google_credentials" ADD CONSTRAINT "google_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."line_credentials" ADD CONSTRAINT "line_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."apple_credentials" ADD CONSTRAINT "apple_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."communities" ADD CONSTRAINT "communities_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "community"."communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_memberships" ADD CONSTRAINT "community_memberships_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_locations" ADD CONSTRAINT "community_locations_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_join_requests" ADD CONSTRAINT "community_join_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_join_requests" ADD CONSTRAINT "community_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcements" ADD CONSTRAINT "announcements_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcements" ADD CONSTRAINT "announcements_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"."activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcement_likes" ADD CONSTRAINT "announcement_likes_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcement_comments" ADD CONSTRAINT "announcement_comments_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcement_attachments" ADD CONSTRAINT "announcement_attachments_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."announcement_bookmarks" ADD CONSTRAINT "announcement_bookmarks_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."albums" ADD CONSTRAINT "albums_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."album_photos" ADD CONSTRAINT "album_photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "media"."albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity"."participation_audit_logs" ADD CONSTRAINT "participation_audit_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "activity"."schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."invite_token_usages" ADD CONSTRAINT "invite_token_usages_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "community"."invite_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."chat_channels" ADD CONSTRAINT "chat_channels_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."chat_channels" ADD CONSTRAINT "chat_channels_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."messages" ADD CONSTRAINT "messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messaging"."chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."messages" ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "messaging"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messaging"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."dm_participants" ADD CONSTRAINT "dm_participants_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messaging"."chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messaging"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."message_reactions" ADD CONSTRAINT "message_reactions_stamp_id_fkey" FOREIGN KEY ("stamp_id") REFERENCES "messaging"."stamps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."category_match_formats" ADD CONSTRAINT "category_match_formats_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "master"."category_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."matching_results" ADD CONSTRAINT "matching_results_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "activity"."schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."matching_results" ADD CONSTRAINT "matching_results_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_categories" ADD CONSTRAINT "community_categories_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_categories" ADD CONSTRAINT "community_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "master"."category_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_participation_levels" ADD CONSTRAINT "community_participation_levels_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_participation_levels" ADD CONSTRAINT "community_participation_levels_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "master"."participation_level_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_activity_days" ADD CONSTRAINT "community_activity_days_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_tags" ADD CONSTRAINT "community_tags_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."polls" ADD CONSTRAINT "polls_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."polls" ADD CONSTRAINT "polls_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "announcement"."polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement"."poll_votes" ADD CONSTRAINT "poll_votes_poll_option_id_fkey" FOREIGN KEY ("poll_option_id") REFERENCES "announcement"."poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_webhook_configs" ADD CONSTRAINT "community_webhook_configs_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_bookmarks" ADD CONSTRAINT "community_bookmarks_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."expense_categories" ADD CONSTRAINT "expense_categories_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."expenses" ADD CONSTRAINT "expenses_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "support"."expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."channel_read_states" ADD CONSTRAINT "channel_read_states_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messaging"."chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."channel_read_states" ADD CONSTRAINT "channel_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."inquiries" ADD CONSTRAINT "inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."inquiries" ADD CONSTRAINT "inquiries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "master"."inquiry_category_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."inquiries" ADD CONSTRAINT "inquiries_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."inquiry_messages" ADD CONSTRAINT "inquiry_messages_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "support"."inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "support"."inquiry_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
