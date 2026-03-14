-- 1. Создание бакета (если еще не существует)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-photos', 'ticket-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Удаляем старые политики, если они есть, для обеспечения возможности повторного выполнения (idempotency)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- 3. Политика: Разрешить публичный просмотр файлов (SELECT)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ticket-photos' );

-- 4. Политика: Разрешить загрузку только авторизованным пользователям (INSERT)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'ticket-photos' );

-- 5. Политика: Разрешить пользователям удалять свои файлы (DELETE)
-- Полезно для будущего функционала редактирования заявок
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'ticket-photos' AND (storage.foldername(name))[1] = 'uploads' );
