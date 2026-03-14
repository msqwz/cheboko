-- Добавление новых ролей в Enum UserRole (если он используется как тип в Postgres)
-- В Supabase часто используются текстовые поля с ограничениями или Enum.
-- Проверим и добавим колонки для верификации и приглашений.

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "verificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "verificationExpires" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "invitationToken" TEXT,
ADD COLUMN IF NOT EXISTS "invitationExpires" TIMESTAMPTZ;

-- Обновим тип ролей, если это необходимо. 
-- В текущей реализации roles хранятся как TEXT. 
-- Добавим комментарий о новых ролях для справки:
-- 'ADMIN', 'OPERATOR', 'REGIONAL_MANAGER', 'CLIENT_NETWORK_HEAD', 'CLIENT_POINT_MANAGER', 'CLIENT_SPECIALIST', 'ENGINEER'

-- Убедимся, что индекс по email уникален (обычно это так)
-- CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
