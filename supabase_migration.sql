-- Таблица пользователей
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'ADMINISTRATOR', 'OPERATOR', 'ENGINEER', 'CLIENT', 'CLIENT_MANAGER')),
  phone TEXT,
  address TEXT,
  latitude TEXT,
  longitude TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица локаций
CREATE TABLE IF NOT EXISTS "Location" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  "clientId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица оборудования
CREATE TABLE IF NOT EXISTS "Equipment" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "serialNumber" TEXT,
  "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS "Ticket" (
  id TEXT PRIMARY KEY,
  "ticketNumber" TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'OPENED', 'ASSIGNED', 'ENROUTE', 'IN_WORK', 'ON_HOLD', 'COMPLETED', 'CANCELED', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  "clientId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "creatorId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "engineerId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "locationId" TEXT REFERENCES "Location"(id) ON DELETE SET NULL,
  "equipmentId" TEXT REFERENCES "Equipment"(id) ON DELETE SET NULL,
  attachments TEXT[],
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  "ticketId" TEXT REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица настроек
CREATE TABLE IF NOT EXISTS "Settings" (
  id TEXT PRIMARY KEY,
  "telegramBotToken" TEXT,
  "telegramChatId" TEXT,
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_ticket_status ON "Ticket"(status);
CREATE INDEX IF NOT EXISTS idx_ticket_creator ON "Ticket"("creatorId");
CREATE INDEX IF NOT EXISTS idx_ticket_engineer ON "Ticket"("engineerId");
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- RLS политики (отключаем для простоты, используем service role key)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

-- Политики для service role
CREATE POLICY "Service role has full access" ON "User" FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON "Location" FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON "Equipment" FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON "Ticket" FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON "Notification" FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON "Settings" FOR ALL USING (true);
