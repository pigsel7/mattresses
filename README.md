# Mattress Store

Базовый монорепозиторий интернет-магазина товаров для сна.

## Стек

- Next.js App Router в `apps/frontend`
- NestJS REST API в `apps/backend`
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- Docker и Docker Compose
- pnpm workspaces
- FSD-структура на frontend

## Структура

```text
apps/
  frontend/        Next.js приложение
  backend/         NestJS API и Prisma schema
packages/
  shared/          Общие Zod-схемы и DTO
  ui/              Базовые UI-компоненты
  config/          Общие env-схемы
scripts/dev/       Локальные dev-команды
```

## Локальный запуск

Установить зависимости:

```sh
pnpm install
```

Скопировать переменные окружения:

```sh
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

Поднять Docker Compose:

```sh
./scripts/dev/up.sh
```

Сгенерировать Prisma Client и применить миграции:

```sh
./scripts/dev/generate.sh
./scripts/dev/migrate.sh
./scripts/dev/seed.sh
```

Seed создает администратора из `ADMIN_EMAIL` / `ADMIN_PASSWORD`, базовые категории,
товары, характеристики и настройки магазина.

## Email-уведомления

После оформления заказа backend создает `Order` в базе и пытается отправить письмо
владельцу магазина. Если SMTP не настроен, заказ все равно создается, а отправка
пропускается.

Заполнить значения можно в корневом `.env` для Docker Compose и в
`apps/backend/.env` для локального запуска backend:

```sh
SHOP_OWNER_EMAIL=owner@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=login@example.com
SMTP_PASSWORD=app-password-or-token
SMTP_FROM="Sleep Shop <no-reply@example.com>"
```

Для локальной разработки без Docker-контейнеров frontend/backend можно запускать
приложения через pnpm, оставив PostgreSQL из Docker Compose:

```sh
pnpm dev:backend
pnpm dev:frontend
```

Frontend будет доступен на `http://localhost:3000`, backend health-check на
`http://localhost:4000/api/health`.

## Админка

После seed создается администратор из `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Вход в админку:

- `http://localhost:3000/admin/login`
- после входа маршрут `/admin` открывается только для авторизованной сессии

Локальные значения для входа уже есть в `apps/backend/.env.example` и
корневом `.env.example`.

## Docker Compose

Поднять PostgreSQL, backend и frontend с пересборкой образов:

```sh
./scripts/dev/up.sh
```

Остановить:

```sh
docker compose down
```

## Dev-скрипты

```sh
./scripts/dev/install.sh
./scripts/dev/up.sh
./scripts/dev/down.sh
./scripts/dev/generate.sh
./scripts/dev/migrate.sh
./scripts/dev/seed.sh
./scripts/dev/reset-db.sh
./scripts/dev/logs.sh
./scripts/dev/lint.sh
./scripts/dev/typecheck.sh
./scripts/dev/test.sh
```
