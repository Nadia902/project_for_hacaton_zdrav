import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://158.160.177.129:8000/api';

/**
 * GET /api/auth/process
 * 
 * Обрабатывает код авторизации от Яндекс OAuth.
 * Отправляет code и state на бекенд FastAPI, который:
 * - Обменивает код на access_token от Яндекс
 * - Получает информацию о пользователе от Яндекс
 * - Сохраняет пользователя в БД
 * - Создает JWT токен
 * - Возвращает данные пользователя и JWT токен
 * 
 * Query параметры:
 * - code: код авторизации от Яндекс
 * - state: параметр для защиты от CSRF (опционально)
 * 
 * Ответ:
 * {
 *   "data": {
 *     "user": { ... },
 *     "token": "jwt_token_here"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: 'Код авторизации не предоставлен' },
        { status: 400 }
      );
    }

    // Отправляем code и state на бекенд для обработки
    const backendResponse = await fetch(`${REMOTE_API_URL}/auth/yandex/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state: state || null,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || 'Ошибка обработки авторизации',
          details: errorData.details || `HTTP ${backendResponse.status}`
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    
    // Бекенд должен вернуть пользователя и JWT токен
    const user = backendData.data?.user || backendData.user;
    const token = backendData.data?.token || backendData.token;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Данные пользователя не получены от бекенда' },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'JWT токен не получен от бекенда' },
        { status: 500 }
      );
    }

    // Возвращаем данные пользователя и токен
    return NextResponse.json({
      data: {
        user,
        token,
      }
    });
  } catch (error) {
    console.error('OAuth process error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при подключении к бекенду',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

