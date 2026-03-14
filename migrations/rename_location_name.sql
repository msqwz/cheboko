-- Переименование колонки name в legalName для таблицы Location
-- Это решит проблему рассогласования фронтенда и бэкенда
ALTER TABLE "Location" RENAME COLUMN "name" TO "legalName";
