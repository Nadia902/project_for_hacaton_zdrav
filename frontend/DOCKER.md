# Docker инструкции

## Быстрый старт

### Сборка образа (основной Dockerfile с standalone)

```bash
docker build -t sololeveling-frontend .
```

### Альтернативная сборка (упрощенный вариант)

Если основной Dockerfile не работает, используйте упрощенный вариант:

```bash
docker build -f Dockerfile.simple -t sololeveling-frontend .
```

**Примечание**: Основной Dockerfile использует `standalone` output для минимального размера образа. Если возникают проблемы, используйте `Dockerfile.simple`.

### Запуск контейнера

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=/api \
  -e NEXT_PUBLIC_REMOTE_API_URL=http://158.160.177.129:8000/api \
  sololeveling-frontend
```

### Использование docker-compose

#### Для production (с OAuth и бэкендом):

1. Создайте файл `.env` в корне проекта со следующими переменными:

```env
# URL вашего бэкенда
NEXT_PUBLIC_REMOTE_API_URL=http://your-backend-server:8000/api

# Yandex OAuth (получите на https://oauth.yandex.com/)
YANDEX_CLIENT_ID=your_yandex_client_id_here
YANDEX_CLIENT_SECRET=your_yandex_client_secret_here
YANDEX_REDIRECT_URI=https://your-domain.com/api/auth/yandex/callback
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

2. Запустите через docker-compose:

```bash
# Запуск production версии
docker-compose -f docker-compose.prod.yml up -d

# Остановка
docker-compose -f docker-compose.prod.yml down

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Пересборка и запуск
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Для разработки:

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f
```

## Переменные окружения

При запуске контейнера можно передать следующие переменные окружения:

### Обязательные для базовой работы:
- `NEXT_PUBLIC_API_URL` - URL для локальных Next.js API routes (по умолчанию: `/api`)
- `NEXT_PUBLIC_REMOTE_API_URL` - URL для удаленного FastAPI сервера (по умолчанию: `http://158.160.177.129:8000/api`)
- `NODE_ENV` - окружение (по умолчанию: `production`)
- `PORT` - порт для запуска приложения (по умолчанию: `3000`)

### Для работы OAuth Яндекс (обязательно для авторизации):
- `YANDEX_CLIENT_ID` - Client ID из Yandex OAuth приложения
- `YANDEX_CLIENT_SECRET` - Client Secret из Yandex OAuth приложения
- `YANDEX_REDIRECT_URI` - Redirect URI для OAuth callback (по умолчанию: `http://localhost:3000/api/auth/yandex/callback`)
- `NEXT_PUBLIC_APP_URL` - Базовый URL приложения (по умолчанию: `http://localhost:3000`)

### Настройка через .env файл (рекомендуется для production):

Создайте файл `.env` в директории с `docker-compose.prod.yml`:

```env
# Бэкенд API
NEXT_PUBLIC_REMOTE_API_URL=http://your-backend-server:8000/api

# Yandex OAuth
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_REDIRECT_URI=https://your-domain.com/api/auth/yandex/callback
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Затем docker-compose автоматически подхватит эти переменные.

## Примеры использования

### Разработка с hot reload

Для разработки лучше использовать локальный запуск:

```bash
npm run dev
```

### Production сборка

```bash
# Сборка
docker build -t sololeveling-frontend:latest .

# Запуск с переменными окружения
docker run -d \
  --name sololeveling-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_REMOTE_API_URL=http://your-backend:8000/api \
  sololeveling-frontend:latest
```

### Использование с docker-compose и бэкендом

Создайте `docker-compose.full.yml`:

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_REMOTE_API_URL=http://backend:8000/api
    depends_on:
      - backend

  backend:
    # Ваша конфигурация бэкенда
    image: your-backend-image
    ports:
      - "8000:8000"
```

## Оптимизация

### Multi-stage build

Dockerfile использует multi-stage build для минимизации размера образа:

1. **deps** - установка зависимостей
2. **builder** - сборка приложения
3. **runner** - production образ с минимальным размером

### Кэширование слоев

Dockerfile оптимизирован для кэширования слоев:

- Зависимости копируются отдельно от исходного кода
- Изменения в коде не требуют переустановки зависимостей

### Размер образа

После сборки размер образа должен быть примерно **200-300 MB**.

## Troubleshooting

### Проблема: Контейнер не запускается

Проверьте логи:

```bash
docker logs sololeveling-frontend
```

### Проблема: Не подключается к бэкенду

Убедитесь, что:

1. Переменная `NEXT_PUBLIC_REMOTE_API_URL` установлена правильно
2. Бэкенд доступен из контейнера (используйте имя сервиса в docker-compose или IP)
3. CORS настроен на бэкенде (или используйте proxy routes)
4. Если бэкенд в другой сети Docker, убедитесь, что они в одной сети или используйте внешний IP

### Проблема: OAuth Яндекс не работает

Убедитесь, что:

1. Переменные `YANDEX_CLIENT_ID` и `YANDEX_CLIENT_SECRET` установлены
2. `YANDEX_REDIRECT_URI` совпадает с настройками в Yandex OAuth приложении
3. `NEXT_PUBLIC_APP_URL` указывает на правильный домен (не localhost для production)
4. В Yandex OAuth приложении указан правильный Redirect URI

### Проблема: Ошибки сборки

Убедитесь, что:

1. Все зависимости указаны в `package.json`
2. Node.js версия совместима (используется Node 20)
3. Достаточно памяти для сборки (рекомендуется минимум 2GB)

## Production рекомендации

1. **Используйте конкретные теги** вместо `latest`
2. **Настройте health checks** для мониторинга (уже настроено в docker-compose.prod.yml)
3. **Используйте secrets** для чувствительных данных (YANDEX_CLIENT_SECRET и т.д.)
4. **Настройте логирование** в централизованную систему
5. **Используйте reverse proxy** (nginx/traefik) для production
6. **Настройте OAuth правильно**:
   - Создайте приложение на https://oauth.yandex.com/
   - Укажите правильный Redirect URI (должен совпадать с `YANDEX_REDIRECT_URI`)
   - Используйте HTTPS для production
7. **Подключение к бэкенду**:
   - Установите `NEXT_PUBLIC_REMOTE_API_URL` на URL вашего бэкенда
   - Если бэкенд в Docker, используйте имя сервиса или внутренний IP
   - Если бэкенд на отдельном сервере, используйте внешний URL

## Безопасность

- Образ использует непривилегированного пользователя `nextjs`
- Минимальный базовый образ (Alpine Linux)
- Отключена телеметрия Next.js
- Не копируются файлы с секретами (.env.local)

