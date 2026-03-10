-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "organizerUserId" TEXT;

-- CreateIndex
CREATE INDEX "Activity_organizerUserId_idx" ON "Activity"("organizerUserId");
