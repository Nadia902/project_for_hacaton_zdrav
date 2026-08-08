import { NextRequest, NextResponse } from 'next/server';

// Используем прямой URL к бэкенду, чтобы избежать циклических запросов на продакшене
const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'https://sololevelingzdravmaps.ru/api';

// Если мы на продакшене и REMOTE_API_URL указывает на тот же домен, используем прямой URL
const getBackendUrl = () => {
  const remoteUrl = REMOTE_API_URL;
  // Если URL относительный или указывает на тот же домен, используем прямой URL к бэкенду
  if (remoteUrl.startsWith('/') || remoteUrl.includes('localhost') || remoteUrl.includes('127.0.0.1')) {
    return 'https://sololevelingzdravmaps.ru/api';
  }
  return remoteUrl;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendUrl()}/ratings/${id}`;

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
        { error: errorData.error || 'Rating not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable', details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const backendUrl = `${getBackendUrl()}/ratings/${id}`;

    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to update rating' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable', details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendUrl()}/ratings/${id}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to delete rating' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({ message: 'Rating deleted' }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable', details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}

