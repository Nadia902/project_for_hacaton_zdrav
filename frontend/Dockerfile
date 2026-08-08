# Multi-stage build для оптимизации размера образа

# Stage 1: Dependencies - установка зависимостей
FROM node:20-slim AS deps
WORKDIR /app

# Копируем файлы для установки зависимостей
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder - сборка приложения
FROM node:20-slim AS builder
WORKDIR /app

# Устанавливаем build-зависимости для компиляции нативных модулей
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Копируем только package.json (без lockfile для правильной установки опциональных зависимостей)
COPY package.json ./

# Удаляем lockfile и node_modules, если они есть, для правильной установки опциональных зависимостей
# Это решает известную проблему npm с опциональными зависимостями
RUN rm -rf package-lock.json node_modules 2>/dev/null || true

# Устанавливаем зависимости заново для правильной установки нативных модулей
# Используем npm install без lockfile для правильной установки опциональных зависимостей
RUN npm install

# Копируем остальные файлы
COPY . .

# Устанавливаем переменные окружения для сборки
# В production эти переменные должны быть установлены через docker-compose или k8s
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_REMOTE_API_URL=http://158.160.177.129:8000/api
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем приложение
RUN npm run build

# Stage 3: Runner - production образ
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем непривилегированного пользователя
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Копируем необходимые файлы из builder
# Next.js создает standalone папку со всеми необходимыми файлами
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Устанавливаем права доступа
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
