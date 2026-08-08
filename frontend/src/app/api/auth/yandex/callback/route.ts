import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/yandex/callback
 * 
 * Обрабатывает callback от Яндекс OAuth.
 * Получает code и state из query параметров и редиректит на фронтенд
 * с закодированными параметрами в формате: /auth/callback?data=eyJjb2RlIjoi...
 * 
 * Query параметры:
 * - code: код авторизации от Яндекс
 * - state: параметр для защиты от CSRF
 * - error: ошибка от Яндекс (если есть)
 */
export async function GET(request: NextRequest) {
  // Получаем базовый URL фронтенда
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (request.headers.get('x-forwarded-proto') && request.headers.get('host')
      ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
      : new URL(request.url).origin);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Проверяем на ошибки от Яндекс
    if (error) {
      const errorData = Buffer.from(JSON.stringify({ error })).toString('base64url');
      return NextResponse.redirect(
        new URL(`/auth/callback?data=${errorData}`, frontendUrl)
      );
    }

    if (!code) {
      const errorData = Buffer.from(JSON.stringify({ 
        error: 'Код авторизации не получен' 
      })).toString('base64url');
      return NextResponse.redirect(
        new URL(`/auth/callback?data=${errorData}`, frontendUrl)
      );
    }

    // Кодируем code и state в base64url для передачи через URL
    const data = {
      code,
      state: state || null,
    };
    
    const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
    
    // Редиректим на фронтенд с закодированными параметрами
    return NextResponse.redirect(
      new URL(`/auth/callback?data=${encodedData}`, frontendUrl)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorData = Buffer.from(JSON.stringify({ 
      error: 'Ошибка обработки авторизации' 
    })).toString('base64url');
    return NextResponse.redirect(
      new URL(`/auth/callback?data=${errorData}`, frontendUrl)
    );
  }
}

