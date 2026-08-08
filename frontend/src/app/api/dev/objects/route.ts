import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = 'https://sololevelingzdravmaps.ru/api';

export async function GET(request: NextRequest) {
  try {
    // Проксируем запрос напрямую к удаленному серверу
    const backendUrl = `${REMOTE_API_URL}/objects`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch objects' },
        { status: response.status }
      );
    }

    // Возвращаем данные напрямую от бэкенда без преобразования
    const backendData = await response.json();
    
    return NextResponse.json(backendData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable', details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}

