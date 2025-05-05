/*
  Warnings:

  - Made the column `userName` on table `UserActivity` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserActivity" ALTER COLUMN "userName" SET NOT NULL,
ALTER COLUMN "userName" SET DEFAULT 'Unknown User';
