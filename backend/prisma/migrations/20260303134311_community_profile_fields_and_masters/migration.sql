-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "activityFrequency" TEXT,
ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "communityTypeId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joinMethod" TEXT NOT NULL DEFAULT 'FREE_JOIN',
ADD COLUMN     "mainActivityArea" TEXT,
ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "nearestStation" TEXT,
ADD COLUMN     "targetGender" TEXT;

-- CreateTable
CREATE TABLE "CommunityTypeMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityTypeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationLevelMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipationLevelMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityCategory" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityParticipationLevel" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,

    CONSTRAINT "CommunityParticipationLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityActivityDay" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "day" TEXT NOT NULL,

    CONSTRAINT "CommunityActivityDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityTag" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "CommunityTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTypeMaster_name_key" ON "CommunityTypeMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMaster_name_key" ON "CategoryMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationLevelMaster_name_key" ON "ParticipationLevelMaster"("name");

-- CreateIndex
CREATE INDEX "CommunityCategory_categoryId_idx" ON "CommunityCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityCategory_communityId_categoryId_key" ON "CommunityCategory"("communityId", "categoryId");

-- CreateIndex
CREATE INDEX "CommunityParticipationLevel_levelId_idx" ON "CommunityParticipationLevel"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityParticipationLevel_communityId_levelId_key" ON "CommunityParticipationLevel"("communityId", "levelId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityActivityDay_communityId_day_key" ON "CommunityActivityDay"("communityId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTag_communityId_tag_key" ON "CommunityTag"("communityId", "tag");

-- CreateIndex
CREATE INDEX "Community_communityTypeId_idx" ON "Community"("communityTypeId");

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_communityTypeId_fkey" FOREIGN KEY ("communityTypeId") REFERENCES "CommunityTypeMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityCategory" ADD CONSTRAINT "CommunityCategory_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityCategory" ADD CONSTRAINT "CommunityCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityParticipationLevel" ADD CONSTRAINT "CommunityParticipationLevel_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityParticipationLevel" ADD CONSTRAINT "CommunityParticipationLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ParticipationLevelMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityActivityDay" ADD CONSTRAINT "CommunityActivityDay_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTag" ADD CONSTRAINT "CommunityTag_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
