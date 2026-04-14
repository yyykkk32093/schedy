/*
  Warnings:

  - You are about to drop the column `communityTypeId` on the `CategoryMaster` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Community` table. All the data in the column will be lost.
  - You are about to drop the column `communityTypeId` on the `Community` table. All the data in the column will be lost.
  - You are about to drop the `CommunityTypeMaster` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CategoryMaster" DROP CONSTRAINT "CategoryMaster_communityTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_communityTypeId_fkey";

-- DropIndex
DROP INDEX "Community_categoryId_idx";

-- DropIndex
DROP INDEX "Community_communityTypeId_idx";

-- AlterTable
ALTER TABLE "CategoryMaster" DROP COLUMN "communityTypeId";

-- AlterTable
ALTER TABLE "Community" DROP COLUMN "categoryId",
DROP COLUMN "communityTypeId";

-- DropTable
DROP TABLE "CommunityTypeMaster";
