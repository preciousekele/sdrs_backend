/*
  Warnings:

  - You are about to drop the column `confirmationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isConfirmed` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "confirmationToken",
DROP COLUMN "isConfirmed",
ADD COLUMN     "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailToken" TEXT,
ADD COLUMN     "emailTokenExpiry" TIMESTAMP(3);
