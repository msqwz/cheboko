# Инструкция по деплою на VPS (Ubuntu/Debian)

Этот метод подходит для любого сервера (VPS/VDS), где вы имеете полный доступ по SSH. Мы будем использовать **Docker** и **Docker Compose**, так как это самый надежный способ.

## 1. Установка Docker на сервер
Самый простой и надежный способ установить официальную версию Docker на Ubuntu:

1. Подключитесь к серверу по SSH.
2. Выполните команду для скачивания и запуска официального установщика:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```
3. Проверьте, что Docker установился:
   ```bash
   docker --version
   docker compose version
   ```
4. (Опционально) Чтобы не писать `sudo` перед каждой командой:
   ```bash
   sudo usermod -aG docker $USER
   ```
   *После этого нужно перезайти на сервер (выход и вход).*

## 2. Подготовка файлов проекта
1. Склонируйте ваш репозиторий на сервер:
   ```bash
   git clone https://github.com/ВАШ_ЛОГИН/cheboko.git
   cd cheboko
   ```
2. Создайте файл `.env` в папке проекта на сервере:
   ```bash
   nano .env
   ```
3. Вставьте в него все переменные (используйте те значения, которые я прислал ранее):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://vash-domen.com
   DATABASE_URL=...
   ```
   *Нажмите Ctrl+O, Enter, Ctrl+X для сохранения.*

## 3. Запуск приложения
Запустите сборку и старт контейнера одной командой:
```bash
sudo docker-compose up -d --build
```
Приложение запустится на порту **3000**.

## 4. Настройка Nginx и SSL (рекомендуется)
Чтобы сайт открывался по домену через HTTPS:
1. Установите Nginx: `sudo apt install nginx`
2. Настройте проксирование на порт 3000.
3. Установите SSL через Certbot (Let's Encrypt).

---
> [!TIP]
> Использование Docker на VPS позволяет вам легко переезжать между хостингами (Timeweb, Reg.ru, Selectel и др.) — достаточно просто скопировать папку с проектом и запустить `docker-compose up`.
