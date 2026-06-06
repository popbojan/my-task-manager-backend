CREATE TYPE "RecurringTaskStatus" AS ENUM (
  'todo',
  'in_progress',
  'done'
);

CREATE TYPE "RecurringFrequency" AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

CREATE TABLE "RecurringTask" (
                                 "id" TEXT NOT NULL,
                                 "title" TEXT NOT NULL,
                                 "description" TEXT,
                                 "status" "RecurringTaskStatus" NOT NULL DEFAULT 'todo',
                                 "frequency" "RecurringFrequency" NOT NULL,
                                 "streakCount" INTEGER NOT NULL DEFAULT 0,
                                 "lastCompletedAt" TIMESTAMP(3),
                                 "lastResetAt" TIMESTAMP(3),
                                 "nextResetAt" TIMESTAMP(3) NOT NULL,
                                 "email" TEXT NOT NULL,
                                 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 "updatedAt" TIMESTAMP(3) NOT NULL,
                                 CONSTRAINT "RecurringTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringTaskProgress" (
                                         "id" TEXT NOT NULL,
                                         "email" TEXT NOT NULL,
                                         "allTasksStreak" INTEGER NOT NULL DEFAULT 0,
                                         "lastCheckedAt" TIMESTAMP(3),
                                         "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                         "updatedAt" TIMESTAMP(3) NOT NULL,
                                         CONSTRAINT "RecurringTaskProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecurringTaskProgress_email_key"
    ON "RecurringTaskProgress"("email");

CREATE INDEX "RecurringTask_email_idx"
    ON "RecurringTask"("email");

CREATE INDEX "RecurringTask_status_idx"
    ON "RecurringTask"("status");

CREATE INDEX "RecurringTask_frequency_idx"
    ON "RecurringTask"("frequency");

CREATE INDEX "RecurringTask_nextResetAt_idx"
    ON "RecurringTask"("nextResetAt");