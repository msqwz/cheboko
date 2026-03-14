# Dockerfile для деплоя на Timeweb Cloud (Next.js Standalone)

FROM node:20-slim AS base

# 1. Установка зависимостей
FROM base AS deps
RUN apt-get update && apt-get install -y libc6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 2. Сборка проекта
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию и линтинг
ENV NEXT_TELEMETRY_DISABLED 1
# Увеличиваем лимит памяти для сборки
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# 3. Финальный образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Настройка standalone режима
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
