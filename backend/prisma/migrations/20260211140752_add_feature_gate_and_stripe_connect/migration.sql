-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "participationFee" INTEGER;

-- CreateTable
CREATE TABLE "UserFeatureRestriction" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeatureRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLimitRestriction" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "limitKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLimitRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityFeatureRestriction" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityFeatureRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityLimitRestriction" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "limitKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityLimitRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeConnectAccount" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeConnectAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePayment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeConnectAccountId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "applicationFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'jpy',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFeatureRestriction_plan_idx" ON "UserFeatureRestriction"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureRestriction_plan_feature_key" ON "UserFeatureRestriction"("plan", "feature");

-- CreateIndex
CREATE INDEX "UserLimitRestriction_plan_idx" ON "UserLimitRestriction"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "UserLimitRestriction_plan_limitKey_key" ON "UserLimitRestriction"("plan", "limitKey");

-- CreateIndex
CREATE INDEX "CommunityFeatureRestriction_grade_idx" ON "CommunityFeatureRestriction"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFeatureRestriction_grade_feature_key" ON "CommunityFeatureRestriction"("grade", "feature");

-- CreateIndex
CREATE INDEX "CommunityLimitRestriction_grade_idx" ON "CommunityLimitRestriction"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityLimitRestriction_grade_limitKey_key" ON "CommunityLimitRestriction"("grade", "limitKey");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_communityId_key" ON "StripeConnectAccount"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_stripeAccountId_key" ON "StripeConnectAccount"("stripeAccountId");

-- CreateIndex
CREATE INDEX "StripeConnectAccount_stripeAccountId_idx" ON "StripeConnectAccount"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePayment_stripePaymentIntentId_key" ON "SchedulePayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "SchedulePayment_userId_idx" ON "SchedulePayment"("userId");

-- CreateIndex
CREATE INDEX "SchedulePayment_stripePaymentIntentId_idx" ON "SchedulePayment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePayment_scheduleId_userId_key" ON "SchedulePayment"("scheduleId", "userId");

-- AddForeignKey
ALTER TABLE "StripeConnectAccount" ADD CONSTRAINT "StripeConnectAccount_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePayment" ADD CONSTRAINT "SchedulePayment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePayment" ADD CONSTRAINT "SchedulePayment_stripeConnectAccountId_fkey" FOREIGN KEY ("stripeConnectAccountId") REFERENCES "StripeConnectAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
