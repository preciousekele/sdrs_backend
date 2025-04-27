/*
  Warnings:

  - You are about to drop the column `emailConfirmed` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailConfirmed",
ADD COLUMN     "isConfirmed" BOOLEAN NOT NULL DEFAULT false;
