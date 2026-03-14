-- 1. Добавление региона в таблицу Location
ALTER TABLE "Location" 
ADD COLUMN IF NOT EXISTS "region" TEXT;

-- 2. Привязка Пользователя к адресу и региону
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "locationId" TEXT REFERENCES "Location"("id"),
ADD COLUMN IF NOT EXISTS "region" TEXT;

-- 3. Мягкое удаление для Заявок
ALTER TABLE "Ticket" 
ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT FALSE;

-- 4. Сначала ОБЯЗАТЕЛЬНО удаляем старое ограничение
-- Оно не дает переименовать CLIENT_MANAGER в CLIENT_NETWORK_HEAD
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_role_check";

-- 5. МИГРАЦИЯ: Теперь можно менять роли
UPDATE "User" SET role = 'CLIENT_NETWORK_HEAD' WHERE role = 'CLIENT_MANAGER';
UPDATE "User" SET role = 'CLIENT_SPECIALIST' WHERE role = 'CLIENT';

-- 6. Устанавливаем новое расширенное ограничение
ALTER TABLE "User" ADD CONSTRAINT "User_role_check" 
CHECK (role IN ('ADMIN', 'OPERATOR', 'ENGINEER', 'REGIONAL_MANAGER', 'CLIENT_NETWORK_HEAD', 'CLIENT_POINT_MANAGER', 'CLIENT_SPECIALIST'));
