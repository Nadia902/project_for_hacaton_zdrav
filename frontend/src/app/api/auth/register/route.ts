import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { users, sessions, generateSessionId, getUserByEmail } from '@/lib/authStorage';
import type { AuthUser } from '@/lib/authStorage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверяем, не существует ли уже пользователь с таким email
    if (getUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Проверяем, не существует ли уже пользователь с таким username
    if (users.some(u => u.username === username)) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем уже существует' },
        { status: 409 }
      );
    }

    // Создаем нового пользователя
    // В реальном приложении пароль должен быть захеширован
    const newUser: AuthUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      password, // В реальном приложении хранить только хеш
      points: 0,
      badges: [],
      level: 'Новичок',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Создаем сессию
    const sessionId = generateSessionId();
    sessions.set(sessionId, newUser.id);

    // Устанавливаем cookie
    const cookieStore = await cookies();
    cookieStore.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    });

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        data: {
          user: userWithoutPassword,
          sessionId,
        },
        message: 'Регистрация успешна',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
