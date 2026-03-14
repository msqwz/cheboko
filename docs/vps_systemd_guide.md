# Деплой на VPS

## 1. Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Загрузка проекта
```bash
cd ~
git clone https://github.com/msqwz/cheboko.git
cd cheboko
```

## 3. Переменные окружения
```bash
nano .env.local
```
Вставьте:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ijfxeuvrtcxhbvbgdeuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnhldXZydGN4aGJ2YmdkZXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjk5MzgsImV4cCI6MjA4ODkwNTkzOH0._s56clkL6xjPSip_6OJXjnlwt7uU3sjrygKH3zQQExk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnhldXZydGN4aGJ2YmdkZXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjk5MzgsImV4cCI6MjA4ODkwNTkzOH0._s56clkL6xjPSip_6OJXjnlwt7uU3sjrygKH3zQQExk
NEXTAUTH_SECRET=cheboko_nextauth_secret_key_change_in_production_2026
NEXTAUTH_URL=http://ВАШ_IP:3000
```
*Ctrl+O, Enter, Ctrl+X — сохранить и выйти.*

## 4. Сборка
```bash
npm install --legacy-peer-deps
npm run build
```

## 5. Запуск
```bash
npm start
```
Сайт будет доступен по адресу `http://ВАШ_IP:3000`
