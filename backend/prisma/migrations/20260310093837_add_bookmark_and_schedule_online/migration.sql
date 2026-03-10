-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingUrl" TEXT;

-- CreateTable
CREATE TABLE "AnnouncementBookmark" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementBookmark_userId_idx" ON "AnnouncementBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementBookmark_announcementId_userId_key" ON "AnnouncementBookmark"("announcementId", "userId");

-- AddForeignKey
ALTER TABLE "AnnouncementBookmark" ADD CONSTRAINT "AnnouncementBookmark_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
