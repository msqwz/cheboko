-- Добавление колонки nextMaintenance в таблицу Equipment
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "nextMaintenance" TIMESTAMPTZ;

-- Исправление статусов в существующих заявках для консистентности
UPDATE "Ticket" SET status = 'OPENED' WHERE status = 'OPEN';
UPDATE "Ticket" SET status = 'IN_WORK' WHERE status = 'IN_PROGRESS';
UPDATE "Ticket" SET status = 'COMPLETED' WHERE status = 'RESOLVED';
UPDATE "Ticket" SET status = 'CANCELED' WHERE status = 'CLOSED';
