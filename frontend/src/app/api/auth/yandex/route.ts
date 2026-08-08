import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://158.160.177.129:8000/api';

/**
 * POST /api/auth/yandex
 * 
 * Инициирует OAuth авторизацию через Яндекс.
 * Отправляет запрос на бекенд FastAPI, который обрабатывает OAuth и возвращает URL для редиректа.
 * 
 * Тело запроса: пустое или {}
 * 
 * Ответ от бекенда должен содержать:
 * {
 *   "data": {
 *     "authUrl": "https://oauth.yandex.ru/authorize?..."
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Отправляем запрос на бекенд FastAPI
    const backendResponse = await fetch(`${REMOTE_API_URL}/auth/yandex`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || 'Ошибка при инициации OAuth авторизации',
          details: errorData.details || `HTTP ${backendResponse.status}`
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    
    // Бекенд должен вернуть URL для редиректа
    const authUrl = backendData.data?.authUrl || backendData.authUrl;
    
    if (!authUrl) {
      return NextResponse.json(
        { error: 'Бекенд не вернул URL для авторизации' },
        { status: 500 }
      );
    }

    // Возвращаем URL для редиректа на фронтенд
    return NextResponse.json({
      data: {
        authUrl: authUrl
      }
    });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при подключении к бекенду',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

