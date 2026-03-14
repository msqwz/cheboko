# Инструкция по деплою на VPS БЕЗ Docker (PM2 + Nginx)

Этот метод использует **PM2** для запуска приложения в фоне и **Nginx** как веб-сервер. Это классический способ деплоя Node.js приложений.

## 1. Подготовка сервера (один раз)
Выполните команды для установки Node.js и PM2:
```bash
# Установка Node.js (версия 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2 (менеджер процессов)
sudo npm install -g pm2
```

## 2. Загрузка и сборка проекта
1. Склонируйте репозиторий:
   ```bash
   git clone https://github.com/msqwz/cheboko.git
   cd cheboko
   ```
2. Установите зависимости и соберите проект:
   ```bash
   npm install --legacy-peer-deps
   npm run build
   ```

## 3. Настройка переменных окружения
Создайте файл `.env.local` в папке проекта:
```bash
nano .env.local
```
Вставьте туда ваши данные:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://vash-domen.com
DATABASE_URL=...
```

## 4. Запуск через PM2
Запустите приложение командой:
```bash
pm2 start npm --name "cheboko" -- start
```
Чтобы приложение автоматически запускалось после перезагрузки сервера:
```bash
pm2 save
pm2 startup
```

## 5. Настройка Nginx
1. Установите Nginx: `sudo apt install nginx`
2. Настройте файл конфигурации `/etc/nginx/sites-available/default`, чтобы он перенаправлял трафик на `localhost:3000`:
   ```bash
   location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $http_host;
       proxy_cache_bypass $http_upgrade;
   }
   ```
3. Перезапустите Nginx: `sudo systemctl restart nginx`

---
> [!TIP]
> Этот метод не требует Docker, поэтому у вас не будет проблем с сетью Docker Hub или DNS-таймаутами контейнеров.
