-- Phase3: #4 Announcement.activityId (nullable FK to Activity)
ALTER TABLE "Announcement" ADD COLUMN "activityId" TEXT;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Announcement_activityId_idx" ON "Announcement"("activityId");

-- Phase3: #19 Message.deletedBy (soft delete - who deleted)
ALTER TABLE "Message" ADD COLUMN "deletedBy" TEXT;

-- Phase3: #18 MessageReaction.stampId nullable + emoji column
ALTER TABLE "MessageReaction" ALTER COLUMN "stampId" DROP NOT NULL;
ALTER TABLE "MessageReaction" ADD COLUMN "emoji" TEXT;
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");

-- Phase3: #53 CommunityBookmark table
CREATE TABLE "CommunityBookmark" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityBookmark_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommunityBookmark_communityId_userId_key" ON "CommunityBookmark"("communityId", "userId");
CREATE INDEX "CommunityBookmark_userId_idx" ON "CommunityBookmark"("userId");
ALTER TABLE "CommunityBookmark" ADD CONSTRAINT "CommunityBookmark_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
