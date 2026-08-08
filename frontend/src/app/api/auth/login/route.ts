import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessions, generateSessionId, getUserByEmail } from '@/lib/authStorage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // В реальном приложении здесь будет проверка пароля через БД с хешированием
    // Для демонстрации просто проверяем существование пользователя и пароль
    const user = getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // В реальном приложении здесь будет проверка хеша пароля
    // Для демо просто проверяем, что пароль совпадает
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Создаем сессию
    const sessionId = generateSessionId();
    sessions.set(sessionId, user.id);

    // Устанавливаем cookie
    const cookieStore = await cookies();
    cookieStore.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    });

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      data: {
        user: userWithoutPassword,
        sessionId,
      },
      message: 'Вход выполнен успешно',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
