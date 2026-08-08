import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://158.160.177.129:8000/api';

export async function GET(request: NextRequest) {
  try {
    const mockUser = {
      id: '1',
      username: 'Тестовый пользователь',
      email: 'test@example.com',
      avatar: undefined,
      points: 750,
      badges: ['Первопроходец', 'Активный участник', 'Эксперт по здоровью'],
      level: 'Эксперт',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json({
      data: mockUser,
    });

  } catch (error) {
    return NextResponse.json(
      { data: null },
      { status: 200 }
    );
  }
}






