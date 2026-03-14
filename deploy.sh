#!/bin/bash

# Скрипт автоматического деплоя Cheboko
# Использование: bash deploy.sh

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Начинаю процесс деплоя ===${NC}"

# 1. Проверка системных ресурсов
echo -e "\n${YELLOW}[1/5] Проверка системы...${NC}"

# Проверка Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js установлен ($NODE_VERSION)${NC}"
else
    echo -e "${RED}✗ Node.js не найден! Установите Node.js перед деплоем.${NC}"
    exit 1
fi

# Проверка памяти
FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
if [ "$FREE_MEM" -lt 500 ]; then
    echo -e "${YELLOW}! Мало оперативной памяти: ${FREE_MEM}MB. Сборка может быть медленной.${NC}"
else
    echo -e "${GREEN}✓ Свободная память: ${FREE_MEM}MB${NC}"
fi

# Проверка места на диске
FREE_DISK=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${GREEN}✓ Свободное место на диске: ${FREE_DISK}${NC}"

# 2. Обновление кода
echo -e "\n${YELLOW}[2/5] Обновление кода из Git...${NC}"
git pull
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Код успешно обновлен${NC}"
else
    echo -e "${RED}✗ Ошибка при git pull${NC}"
    exit 1
fi

# 3. Установка зависимостей
echo -e "\n${YELLOW}[3/5] Установка зависимостей...${NC}"
npm install --legacy-peer-deps
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Зависимости установлены${NC}"
else
    echo -e "${RED}✗ Ошибка при npm install${NC}"
    exit 1
fi

# 4. Сборка проекта
echo -e "\n${YELLOW}[4/5] Сборка Next.js...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Сборка завершена успешно${NC}"
else
    echo -e "${RED}✗ Ошибка при сборке (npm run build)${NC}"
    exit 1
fi

# 5. Перезапуск приложения
echo -e "\n${YELLOW}[5/5] Перезапуск приложения...${NC}"

# Ищем процесс на порту 3000 и убиваем его
PID=$(lsof -t -i:3000)
if [ -n "$PID" ]; then
    echo -e "${YELLOW}Останавливаю старый процесс (PID: $PID)...${NC}"
    kill -9 $PID
fi

# Запуск в фоне через nohup
echo -e "${YELLOW}Запускаю новое приложение в фоне...${NC}"
nohup npm start > app.log 2>&1 &

# Даем время на старт
sleep 5

# Финальная проверка
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "\n${GREEN}=======================================${NC}"
    echo -e "${GREEN}   ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО! 🚀${NC}"
    echo -e "${GREEN}   Сайт работает на порту 3000${NC}"
    echo -e "${GREEN}=======================================${NC}"
else
    echo -e "${RED}✗ Ошибка: Приложение не отвечает на порту 3000${NC}"
    echo -e "${YELLOW}Проверьте лог командой: tail -n 50 app.log${NC}"
    exit 1
fi
