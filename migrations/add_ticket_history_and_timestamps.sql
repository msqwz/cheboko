-- Таблица истории изменений заявок
CREATE TABLE IF NOT EXISTS "TicketHistory" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ticketId" TEXT NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON "TicketHistory"("ticketId");
CREATE INDEX IF NOT EXISTS idx_ticket_history_user ON "TicketHistory"("userId");

ALTER TABLE "TicketHistory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role has full access" ON "TicketHistory";
CREATE POLICY "Service role has full access" ON "TicketHistory" FOR ALL USING (true);

-- Поля для точного расчёта времени выполнения по ТЗ
-- openedAt: момент перехода в статус OPENED (от него считаем время)
-- completedAt: момент перехода в статус COMPLETED
ALTER TABLE "Ticket"
  ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "operatorComment" TEXT,
  ADD COLUMN IF NOT EXISTS "engineerComment" TEXT,
  ADD COLUMN IF NOT EXISTS "holdReason" TEXT,
  ADD COLUMN IF NOT EXISTS "engineerRecommendation" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduledDate" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "problemType" TEXT;

-- Автоматически проставляем openedAt/completedAt через триггер
CREATE OR REPLACE FUNCTION update_ticket_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('OPENED', 'OPEN') AND OLD.status NOT IN ('OPENED', 'OPEN') AND NEW."openedAt" IS NULL THEN
    NEW."openedAt" = NOW();
  END IF;
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' AND NEW."completedAt" IS NULL THEN
    NEW."completedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_timestamps_trigger ON "Ticket";
CREATE TRIGGER ticket_timestamps_trigger
  BEFORE UPDATE ON "Ticket"
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamps();
