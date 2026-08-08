import { NextRequest, NextResponse } from 'next/server';
import type { InfrastructureObject, ObjectDetails } from '@/types';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'https://sololevelingzdravmaps.ru/api';

// Функция для преобразования объекта из формата бэкенда (используем ту же логику, что и в route.ts)
function transformBackendObject(backendObj: any, index: number = 0): InfrastructureObject {
  // Используем ID от бэкенда, если есть, иначе генерируем
  const id = backendObj.id !== undefined && backendObj.id !== null 
    ? String(backendObj.id) 
    : (() => {
        const lat = Number(backendObj.latitude) || 0;
        const lng = Number(backendObj.longitude) || 0;
        const name = backendObj.name || '';
        const hash = `${lat}_${lng}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_');
        return `obj_${hash}_${index}`;
      })();

  const typeMap: Record<string, any> = {
    'education': 'education',
    'medical': 'medical',
    'health_facilities': 'health_facilities',
    'healthy_food': 'healthy_food',
    'alcohol_tobacco': 'alcohol_tobacco',
    'industrial': 'industrial',
    'waste_collection': 'waste_collection',
  };

  const averageRating = backendObj.rating ?? 
                       backendObj.averageRating ?? 
                       backendObj.average_rating ?? 
                       undefined;

  const ratedByUserIds = backendObj.ratedByUserIds ?? 
                         backendObj.rated_by_user_ids ?? 
                         backendObj.ratedBy ?? 
                         backendObj.rated_by ?? 
                         undefined;

  let ratingsCount = backendObj.ratingsCount ?? 
                    backendObj.ratings_count ?? 
                    0;

  if (ratedByUserIds && Array.isArray(ratedByUserIds)) {
    ratingsCount = ratedByUserIds.length;
  }

  // Валидация координат
  // Преобразуем в число, учитывая что может быть строка или число
  const lat = typeof backendObj.latitude === 'string' 
    ? parseFloat(backendObj.latitude) 
    : Number(backendObj.latitude);
  const lng = typeof backendObj.longitude === 'string'
    ? parseFloat(backendObj.longitude)
    : Number(backendObj.longitude);
  
  // Проверяем, что координаты валидны (широта: -90 до 90, долгота: -180 до 180)
  const validLat = !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : lat;
  const validLng = !isNaN(lng) && lng >= -180 && lng <= 180 ? lng : lng;

  return {
    id,
    name: backendObj.name || 'Без названия',
    type: typeMap[backendObj.tip] || 'health_facilities',
    location: {
      lat: validLat,
      lng: validLng,
      address: backendObj.adres || undefined,
    },
    averageRating: averageRating !== undefined ? Number(averageRating) : undefined,
    ratingsCount,
    ratedByUserIds: ratedByUserIds && Array.isArray(ratedByUserIds) ? ratedByUserIds : undefined,
    mo: backendObj.mo ?? backendObj.МО ?? undefined, // Медицинская организация / Район
    createdAt: backendObj.added ? 
               (new Date(backendObj.added).toISOString()) : 
               (backendObj.createdAt ?? 
                backendObj.created_at ?? 
                backendObj.date ?? 
                new Date().toISOString()),
    updatedAt: backendObj.updatedAt ?? 
               backendObj.updated_at ?? 
               new Date().toISOString(),
    createdBy: backendObj.createdBy ?? 
               backendObj.created_by ?? 
               'system',
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Получаем все объекты с бэкенда
    const response = await fetch(`${REMOTE_API_URL}/objects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch objects' },
        { status: response.status }
      );
    }

    const backendData = await response.json();
    const backendObjects = Array.isArray(backendData) ? backendData : (backendData.data || []);
    
    // Ищем объект по ID от бэкенда или по преобразованному ID
    const numericId = !isNaN(Number(id)) ? Number(id) : null;
    const backendObj = numericId 
      ? backendObjects.find((obj: any) => obj.id === numericId)
      : null;
    
    // Если не нашли по ID от бэкенда, ищем по преобразованному ID
    const object = backendObj 
      ? transformBackendObject(backendObj, 0)
      : (() => {
          const transformedObjects: InfrastructureObject[] = backendObjects.map((obj: any, index: number) => 
            transformBackendObject(obj, index)
          );
          return transformedObjects.find((obj: InfrastructureObject) => obj.id === id);
        })();

    if (!object) {
      return NextResponse.json({ error: 'Объект не найден' }, { status: 404 });
    }

    // TODO: В будущем здесь будет запрос к бэкенду для получения оценок
    // Пока возвращаем объект без оценок
    const objectDetails: ObjectDetails = {
      ...object,
      ratings: [],
      averageCriterionRatings: {},
    };

    return NextResponse.json({
      data: objectDetails,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: Реализовать обновление объекта через бэкенд
  return NextResponse.json(
    { error: 'Not implemented yet' },
    { status: 501 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: Реализовать удаление объекта через бэкенд
  return NextResponse.json(
    { error: 'Not implemented yet' },
    { status: 501 }
  );
}
