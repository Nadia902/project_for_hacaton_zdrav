This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Установка зависимостей

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта (можно скопировать из `.env.example`):

```bash
cp .env.example .env.local
```

Или создайте вручную со следующим содержимым:

```env
# URL для локальных Next.js API routes
NEXT_PUBLIC_API_URL=/api

# URL для удаленного FastAPI сервера
NEXT_PUBLIC_REMOTE_API_URL=http://158.160.177.129:8000/api

# Yandex OAuth Configuration
YANDEX_CLIENT_ID=your_yandex_client_id_here
YANDEX_CLIENT_SECRET=your_yandex_client_secret_here
YANDEX_REDIRECT_URI=http://localhost:3000/api/auth/yandex/callback

# App URL (для production измените на ваш домен)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Настройка OAuth Яндекса

**Важно**: OAuth авторизация работает через бекенд FastAPI. Подробная инструкция по настройке находится в файле **[YANDEX_OAUTH_MANUAL.md](./YANDEX_OAUTH_MANUAL.md)**.

Краткая инструкция:

1. Перейдите на [Yandex OAuth](https://oauth.yandex.com/)
2. Создайте новое приложение:
   - **Название**: Здоровая среда (или любое другое)
   - **Платформа**: Веб-сервисы
   - **Redirect URI**: `http://localhost:3000/api/auth/yandex/callback` (для разработки)
3. После создания приложения вы получите:
   - **Client ID** - скопируйте в `YANDEX_CLIENT_ID` (на бекенде)
   - **Client Secret** - скопируйте в `YANDEX_CLIENT_SECRET` (на бекенде)
4. Для production обновите `YANDEX_REDIRECT_URI` и `NEXT_PUBLIC_APP_URL` на ваш домен

**Примечание**: Переменные окружения `YANDEX_CLIENT_ID` и `YANDEX_CLIENT_SECRET` должны быть настроены на **бекенде FastAPI**, а не на фронтенде. Фронтенд использует только `NEXT_PUBLIC_REMOTE_API_URL` для подключения к бекенду.

### 3. Запуск development сервера

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
