import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'https://sololevelingzdravmaps.ru/api';

const getBackendUrl = () => {
  const remoteUrl = REMOTE_API_URL;
  if (remoteUrl.startsWith('/') || remoteUrl.includes('localhost') || remoteUrl.includes('127.0.0.1')) {
    return 'https://sololevelingzdravmaps.ru/api';
  }
  return remoteUrl;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const objectId = searchParams.get('objectId');
    const userId = searchParams.get('userId');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    if (userId === '1') {
      const mockRatings = [
        {
          id: 'rating-1',
          objectId: '123',
          userId: '1',
          criterionRatings: [
            { criterionId: 'product_quality', value: 5 },
            { criterionId: 'service_quality', value: 4 },
            { criterionId: 'cleanliness', value: 5 },
          ],
          comment: 'Отличное место! Очень чисто и уютно. Персонал вежливый, обслуживание на высшем уровне.',
          photos: [],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'rating-2',
          objectId: '456',
          userId: '1',
          criterionRatings: [
            { criterionId: 'accessibility', value: 4 },
            { criterionId: 'safety', value: 5 },
            { criterionId: 'environment', value: 4 },
          ],
          comment: 'Отличное место! Всё на высоте, рекомендую всем посетить это место.',
          photos: [],
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'rating-3',
          objectId: '789',
          userId: '1',
          criterionRatings: [
            { criterionId: 'product_quality', value: 3 },
            { criterionId: 'price', value: 4 },
            { criterionId: 'location', value: 5 },
          ],
          comment: 'Неплохо, но есть куда расти. Расположение удобное, цены приемлемые.',
          photos: [],
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'rating-4',
          objectId: '101',
          userId: '1',
          criterionRatings: [
            { criterionId: 'service_quality', value: 5 },
            { criterionId: 'cleanliness', value: 5 },
            { criterionId: 'atmosphere', value: 5 },
          ],
          comment: 'Превосходное обслуживание! Чистота идеальная, атмосфера приятная. Обязательно вернусь!',
          photos: [],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'rating-5',
          objectId: '202',
          userId: '1',
          criterionRatings: [
            { criterionId: 'accessibility', value: 3 },
            { criterionId: 'safety', value: 4 },
            { criterionId: 'environment', value: 4 },
          ],
          comment: 'Хорошее место, но нужно улучшить доступность для людей с ограниченными возможностями.',
          photos: [],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      let filteredRatings = mockRatings;
      if (objectId) {
        filteredRatings = mockRatings.filter(r => r.objectId === objectId);
      }

      return NextResponse.json({
        data: filteredRatings,
        total: filteredRatings.length,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: false,
      });
    }

    const backendUrl = new URL(`${getBackendUrl()}/ratings`);
    
    if (objectId) {
      backendUrl.searchParams.append('objectId', objectId);
    }
    if (userId) {
      backendUrl.searchParams.append('userId', userId);
    }
    backendUrl.searchParams.append('page', page);
    backendUrl.searchParams.append('limit', limit);

    const response = await fetch(backendUrl.toString(), {
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
        { error: errorData.error || 'Failed to fetch ratings' },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = new URL(`${getBackendUrl()}/ratings`);
    backendUrl.searchParams.append('user_id', '1');
    
    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
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
        { error: errorData.error || 'Failed to create rating' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable', details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}

