CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Language" AS ENUM ('en', 'de', 'sr');

CREATE TABLE "User" (
                        "id" TEXT NOT NULL,
                        "email" TEXT NOT NULL,
                        "language" "Language" NOT NULL DEFAULT 'en',
                        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        "updatedAt" TIMESTAMP(3) NOT NULL,
                        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

INSERT INTO "User" ("id", "email", "updatedAt")
SELECT gen_random_uuid()::text, email, CURRENT_TIMESTAMP
FROM (
         SELECT DISTINCT email FROM "Task"
         UNION
         SELECT DISTINCT email FROM "RecurringTask"
         UNION
         SELECT DISTINCT email FROM "RecurringTaskProgress"
     ) emails;

ALTER TABLE "Task" ADD COLUMN "userId" TEXT;
ALTER TABLE "RecurringTask" ADD COLUMN "userId" TEXT;
ALTER TABLE "RecurringTaskProgress" ADD COLUMN "userId" TEXT;

UPDATE "Task" t
SET "userId" = u.id
    FROM "User" u
WHERE t.email = u.email;

UPDATE "RecurringTask" rt
SET "userId" = u.id
    FROM "User" u
WHERE rt.email = u.email;

UPDATE "RecurringTaskProgress" rtp
SET "userId" = u.id
    FROM "User" u
WHERE rtp.email = u.email;

ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "RecurringTask" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "RecurringTaskProgress" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "RecurringTask_userId_idx" ON "RecurringTask"("userId");

DROP INDEX "RecurringTaskProgress_email_key";

CREATE UNIQUE INDEX "RecurringTaskProgress_userId_key" ON "RecurringTaskProgress"("userId");

ALTER TABLE "Task"
    ADD CONSTRAINT "Task_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringTask"
    ADD CONSTRAINT "RecurringTask_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringTaskProgress"
    ADD CONSTRAINT "RecurringTaskProgress_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "Task_email_idx";
DROP INDEX "RecurringTask_email_idx";

ALTER TABLE "Task" DROP COLUMN "email";
ALTER TABLE "RecurringTask" DROP COLUMN "email";
ALTER TABLE "RecurringTaskProgress" DROP COLUMN "email";