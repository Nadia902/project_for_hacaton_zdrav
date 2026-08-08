import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { users, sessions, generateSessionId, getUserByEmail } from '@/lib/authStorage';
import type { AuthUser } from '@/lib/authStorage';

// Получаем настройки OAuth из переменных окружения
const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID;
const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET;
const REDIRECT_URI = process.env.YANDEX_REDIRECT_URI || 
  (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/auth/yandex';

export async function GET(request: NextRequest) {
  // Используем правильный базовый URL из переменных окружения или из заголовков
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!baseUrl) {
    // Пытаемся получить из заголовков (для прокси/реверс-прокси)
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const host = request.headers.get('host');
    if (forwardedProto && host) {
      baseUrl = `${forwardedProto}://${host}`;
    } else {
      // Используем URL из запроса, но заменяем 0.0.0.0 на host из заголовков
      const url = new URL(request.url);
      if (host && !url.hostname.includes('0.0.0.0')) {
        baseUrl = `${url.protocol}//${host}`;
      } else {
        baseUrl = url.origin;
      }
    }
  }
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Если есть код авторизации - обрабатываем callback
  if (code) {
    try {
      // Проверяем на ошибки от Яндекс
      if (error) {
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent('Ошибка авторизации: ' + error)}`, baseUrl)
        );
      }

      // Проверяем state для защиты от CSRF
      const cookieStore = await cookies();
      const savedState = cookieStore.get('yandex_oauth_state')?.value;
      cookieStore.delete('yandex_oauth_state');

      if (!savedState || savedState !== state) {
        return NextResponse.redirect(
          new URL('/auth?error=' + encodeURIComponent('Неверный state параметр'), baseUrl)
        );
      }

      if (!YANDEX_CLIENT_ID || !YANDEX_CLIENT_SECRET) {
        return NextResponse.redirect(
          new URL('/auth?error=' + encodeURIComponent('OAuth не настроен'), baseUrl)
        );
      }

      // Обмениваем код на токен
      const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: YANDEX_CLIENT_ID,
          client_secret: YANDEX_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        return NextResponse.redirect(
          new URL('/auth?error=' + encodeURIComponent('Ошибка получения токена'), baseUrl)
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        return NextResponse.redirect(
          new URL('/auth?error=' + encodeURIComponent('Токен не получен'), baseUrl)
        );
      }

      // Получаем информацию о пользователе
      const userInfoResponse = await fetch('https://login.yandex.ru/info', {
        headers: {
          Authorization: `OAuth ${accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        return NextResponse.redirect(
          new URL('/auth?error=' + encodeURIComponent('Ошибка получения информации о пользователе'), baseUrl)
        );
      }

      const yandexUser = await userInfoResponse.json();

      // Получаем email пользователя
      const userEmail = yandexUser.default_email || yandexUser.emails?.[0];
      if (!userEmail) {
        return NextResponse.redirect(
          new URL('/auth?error=' + encodeURIComponent('Email не получен от Яндекс'), baseUrl)
        );
      }

      // Ищем или создаем пользователя
      let user = getUserByEmail(userEmail);
      
      if (!user) {
        // Создаем нового пользователя
        const newUser: AuthUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: yandexUser.login || yandexUser.first_name || yandexUser.real_name || 'Пользователь',
          email: userEmail,
          points: 0,
          badges: [],
          level: 'Новичок',
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        user = newUser;
      }

      // Создаем сессию
      const sessionId = generateSessionId();
      sessions.set(sessionId, user.id);

      // Устанавливаем cookie с сессией и редиректим на страницу авторизации для проверки
      // НЕ редиректим напрямую на /map, чтобы фронтенд мог правильно обработать авторизацию
      const response = NextResponse.redirect(new URL('/auth?success=true', baseUrl));
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 дней
      });

      return response;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        new URL('/auth?error=' + encodeURIComponent('Ошибка обработки авторизации'), baseUrl)
      );
    }
  }

  // Если кода нет - инициируем OAuth
  try {
    if (!YANDEX_CLIENT_ID) {
      console.error('YANDEX_CLIENT_ID не найден в переменных окружения');
      return NextResponse.json(
        { 
          error: 'YANDEX_CLIENT_ID не настроен',
          hint: 'Убедитесь, что переменная YANDEX_CLIENT_ID передана в docker-compose через .env файл'
        },
        { status: 500 }
      );
    }

    // Генерируем state для защиты от CSRF
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Сохраняем state в cookie для проверки в callback
    const response = NextResponse.redirect(
      `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`
    );
    
    response.cookies.set('yandex_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 минут
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при перенаправлении на OAuth' },
      { status: 500 }
    );
  }
}

