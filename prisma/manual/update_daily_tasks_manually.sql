UPDATE "RecurringTask"
SET
    status = 'todo',
    "lastResetAt" = NOW(),
    "nextResetAt" = '2026-06-08 00:00:00.000',
    "updatedAt" = NOW()
WHERE
    status = 'done'
  AND frequency = 'daily'
  AND "nextResetAt" <= NOW();


UPDATE "RecurringTask"
SET
    status = 'todo',
    "streakCount" = 0,
    "lastResetAt" = NOW(),
    "nextResetAt" = '2026-06-08 00:00:00.000',
    "updatedAt" = NOW()
WHERE
    status <> 'done'
  AND frequency = 'daily'
  AND "nextResetAt" <= NOW();