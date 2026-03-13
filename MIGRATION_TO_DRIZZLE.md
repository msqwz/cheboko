# Миграция с Prisma на Drizzle ORM

## ✅ Что уже сделано

1. Установлены зависимости: `drizzle-orm`, `postgres`, `drizzle-kit`
2. Создана схема базы данных в `src/lib/schema.ts`
3. Создан клиент БД в `src/lib/db.ts`
4. Создана конфигурация `drizzle.config.ts`
5. Созданы примеры миграции API роутов (*.drizzle.ts)

## 📋 Шаги для завершения миграции

### 1. Обновите package.json скрипты

Замените Prisma скрипты на Drizzle:

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

### 2. Примените схему к базе данных

```bash
npm run db:push
```

### 3. Замените импорты во всех API роутах

**Было (Prisma):**
```typescript
import { prisma } from '@/lib/prisma';
```

**Стало (Drizzle):**
```typescript
import { db } from '@/lib/db';
import { users, tickets, locations } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
```

### 4. Шпаргалка по миграции запросов

#### Получение всех записей
```typescript
// Prisma
await prisma.user.findMany()

// Drizzle
await db.select().from(users)
```

#### Получение с условием
```typescript
// Prisma
await prisma.user.findUnique({ where: { id } })

// Drizzle
await db.select().from(users).where(eq(users.id, id))
```

#### Создание записи
```typescript
// Prisma
await prisma.user.create({ data: { ... } })

// Drizzle
await db.insert(users).values({ ... }).returning()
```

#### Обновление
```typescript
// Prisma
await prisma.user.update({ where: { id }, data: { ... } })

// Drizzle
await db.update(users).set({ ... }).where(eq(users.id, id)).returning()
```

#### Удаление
```typescript
// Prisma
await prisma.user.delete({ where: { id } })

// Drizzle
await db.delete(users).where(eq(users.id, id))
```

#### JOIN запросы
```typescript
// Prisma
await prisma.ticket.findMany({ include: { client: true, location: true } })

// Drizzle
await db.select()
  .from(tickets)
  .leftJoin(users, eq(tickets.clientId, users.id))
  .leftJoin(locations, eq(tickets.locationId, locations.id))
```

### 5. Файлы для миграции

Замените во всех этих файлах:
- `src/app/api/users/route.ts`
- `src/app/api/tickets/route.ts`
- `src/app/api/tickets/[id]/route.ts`
- `src/app/api/locations/route.ts`
- `src/app/api/equipment/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/profile/route.ts`
- `src/lib/auth.ts`

### 6. После миграции

Удалите Prisma:
```bash
npm uninstall prisma @prisma/client
rm -rf prisma
rm -rf src/generated
```

## 🎯 Преимущества Drizzle

- ⚡ Быстрее Prisma на 20-30%
- 📦 Меньше размер bundle
- 🔒 Полная типобезопасность
- 🛠️ Прямой SQL контроль
- 🚀 Нет генерации клиента

## 📚 Документация

https://orm.drizzle.team/docs/overview
