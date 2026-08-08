import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'https://sololevelingzdravmaps.ru/api';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${REMOTE_API_URL}/users/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Не используем кэш для актуальных данных
      cache: 'no-store',
    });

    if (!response.ok) {
      // Возвращаем ошибку с соответствующим статус-кодом от бэкенда
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch users count' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // При сетевой ошибке возвращаем 502 Bad Gateway
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}
