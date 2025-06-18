-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "offenseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "punishmentDuration" TEXT,
ADD COLUMN     "resumptionPeriod" TEXT;
