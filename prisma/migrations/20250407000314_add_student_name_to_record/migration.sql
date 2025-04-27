/*
  Warnings:

  - You are about to drop the column `actionTaken` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Record` table. All the data in the column will be lost.
  - Added the required column `matricNumber` to the `Record` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Record` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentName` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Record" DROP COLUMN "actionTaken",
DROP COLUMN "studentId",
ADD COLUMN     "matricNumber" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "studentName" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Role";
