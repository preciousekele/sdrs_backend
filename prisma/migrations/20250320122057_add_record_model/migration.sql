-- CreateTable
CREATE TABLE "Record" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "offense" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);
