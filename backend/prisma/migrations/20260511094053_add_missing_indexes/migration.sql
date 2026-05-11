-- AlterTable
ALTER TABLE "HelpFeedback" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "CategoryMaster_sortOrder_idx" ON "CategoryMaster"("sortOrder");

-- CreateIndex
CREATE INDEX "CommunityActivityDay_communityId_idx" ON "CommunityActivityDay"("communityId");

-- CreateIndex
CREATE INDEX "CommunityTag_communityId_idx" ON "CommunityTag"("communityId");

-- CreateIndex
CREATE INDEX "HelpFeedback_userId_createdAt_idx" ON "HelpFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryMessage_authorUserId_idx" ON "InquiryMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "MessageReaction_stampId_idx" ON "MessageReaction"("stampId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

-- CreateIndex
CREATE INDEX "OutboxDeadLetter_failedAt_idx" ON "OutboxDeadLetter"("failedAt");

-- CreateIndex
CREATE INDEX "OutboxDeadLetter_routingKey_idx" ON "OutboxDeadLetter"("routingKey");

-- CreateIndex
CREATE INDEX "ParticipationLevelMaster_sortOrder_idx" ON "ParticipationLevelMaster"("sortOrder");

-- CreateIndex
CREATE INDEX "PlanMaster_sortOrder_idx" ON "PlanMaster"("sortOrder");

-- CreateIndex
CREATE INDEX "PlanMaster_availableFrom_availableTo_idx" ON "PlanMaster"("availableFrom", "availableTo");
