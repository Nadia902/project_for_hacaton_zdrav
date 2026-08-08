import { NextRequest, NextResponse } from 'next/server';
import type { InfrastructureObject, ObjectType } from '@/types';

/**
 * API Route для работы с объектами инфраструктуры
 * 
 * Преобразует данные из формата бэкенда в формат фронтенда.
 * 
 * Ожидаемые поля от бэкенда:
 * - id: number - ID объекта от бэкенда
 * - name: string - название объекта
 * - adres: string - адрес объекта
 * - latitude: number - широта
 * - longitude: number - долгота
 * - tip: string - тип объекта (education, medical, healthy_food, etc.)
 * - mo: string - медицинская организация / район (опционально)
 * - added: string - дата добавления в формате "YYYY-MM-DD" (опционально)
 * - rating / averageRating / average_rating: number - средний рейтинг (опционально)
 * - ratedByUserIds / rated_by_user_ids / ratedBy / rated_by: string[] - массив ID пользователей, которые проставили оценку (опционально)
 * - ratingsCount / ratings_count: number - количество оценок (опционально, вычисляется из массива пользователей если не указано)
 */

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

// Маппинг типов из бэкенда в типы фронтенда
function mapBackendTypeToFrontendType(tip: string): ObjectType {
  const typeMap: Record<string, ObjectType> = {
    'education': 'education',
    'medical': 'medical',
    'health_facilities': 'health_facilities',
    'healthy_food': 'healthy_food',
    'alcohol_tobacco': 'alcohol_tobacco',
    'industrial': 'industrial',
    'waste_collection': 'waste_collection',
  };
  
  const mappedType = typeMap[tip] || 'health_facilities';
  return mappedType;
}

// Генерация стабильного ID на основе данных объекта
function generateObjectId(obj: any, index: number): string {
  // Используем координаты и название для создания стабильного ID
  const lat = obj.latitude || 0;
  const lng = obj.longitude || 0;
  const name = obj.name || '';
  const hash = `${lat}_${lng}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_');
  return `obj_${hash}_${index}`;
}

// Преобразование данных из формата бэкенда в формат фронтенда
function transformBackendObject(backendObj: any, index: number): InfrastructureObject {
  // Используем ID от бэкенда, если есть, иначе генерируем
  const id = backendObj.id !== undefined && backendObj.id !== null 
    ? String(backendObj.id) 
    : generateObjectId(backendObj, index);
  
  // Обрабатываем рейтинг - может быть в разных форматах (rating, averageRating, average_rating)
  const averageRating = backendObj.rating ?? 
                       backendObj.averageRating ?? 
                       backendObj.average_rating ?? 
                       undefined;
  
  // Обрабатываем массив ID пользователей, которые проставили оценку
  // Может быть в разных форматах (ratedByUserIds, rated_by_user_ids, ratedBy, rated_by)
  const ratedByUserIds = backendObj.ratedByUserIds ?? 
                         backendObj.rated_by_user_ids ?? 
                         backendObj.ratedBy ?? 
                         backendObj.rated_by ?? 
                         undefined;
  
  // Количество оценок - либо из бэкенда, либо вычисляем из массива пользователей
  let ratingsCount = backendObj.ratingsCount ?? 
                    backendObj.ratings_count ?? 
                    0;
  
  // Если есть массив пользователей, используем его длину
  if (ratedByUserIds && Array.isArray(ratedByUserIds)) {
    ratingsCount = ratedByUserIds.length;
  }
  
  // Валидация координат
  // Преобразуем в число, учитывая что может быть строка или число
  const latRaw = backendObj.latitude;
  const lngRaw = backendObj.longitude;
  
  const lat = typeof latRaw === 'string' 
    ? parseFloat(latRaw) 
    : Number(latRaw);
  const lng = typeof lngRaw === 'string'
    ? parseFloat(lngRaw)
    : Number(lngRaw);
  
  // Проверяем, что координаты валидны (широта: -90 до 90, долгота: -180 до 180)
  // Если координаты невалидны, возвращаем NaN чтобы объект был отфильтрован
  const validLat = !isNaN(lat) && isFinite(lat) && lat >= -90 && lat <= 90 ? lat : NaN;
  const validLng = !isNaN(lng) && isFinite(lng) && lng >= -180 && lng <= 180 ? lng : NaN;
  
  return {
    id,
    name: backendObj.name || 'Без названия',
    type: mapBackendTypeToFrontendType(backendObj.tip || 'health_facilities'),
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

export async function GET(request: NextRequest) {
  try {
    // Получаем параметры запроса
    const searchParams = request.nextUrl.searchParams;
    const types = searchParams.getAll('types');
    const minRating = searchParams.get('minRating');
    const page = parseInt(searchParams.get('page') || '1');
    // Увеличиваем лимит по умолчанию, чтобы получить все объекты (как в dev версии)
    const limit = parseInt(searchParams.get('limit') || '10000');

    // Формируем URL для запроса к бэкенду с параметрами фильтров
    const backendUrl = new URL(`${getBackendUrl()}/objects`);
    
    // Передаем параметры фильтров в запрос к бэкенду
    if (types.length > 0) {
      types.forEach(type => backendUrl.searchParams.append('types', type));
    }
    if (minRating) {
      backendUrl.searchParams.append('minRating', minRating);
    }
    if (page > 1) {
      backendUrl.searchParams.append('page', page.toString());
    }
    if (limit !== 10000) {
      backendUrl.searchParams.append('limit', limit.toString());
    }

    // Делаем запрос к реальному бэкенду
    const backendUrlString = backendUrl.toString();
    
    const response = await fetch(backendUrlString, {
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

    // Получаем данные от бэкенда
    let backendData;
    try {
      backendData = await response.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON response from server' },
        { status: 500 }
      );
    }
    
    // Бэкенд возвращает массив напрямую, а не объект с data
    // Преобразуем массив объектов из формата бэкенда
    const backendObjects = Array.isArray(backendData) ? backendData : (backendData.data || []);
    
    // Преобразуем каждый объект в формат фронтенда
    let transformedObjects: InfrastructureObject[] = backendObjects.map((obj: any, index: number) => 
      transformBackendObject(obj, index)
    );
    
    // Фильтруем объекты с невалидными координатами (NaN, 0, или вне диапазона)
    transformedObjects = transformedObjects.filter((obj) => {
      const lat = obj.location.lat;
      const lng = obj.location.lng;
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && 
                             isFinite(lat) && isFinite(lng) &&
                             lat !== 0 && lng !== 0 &&
                             lat >= -90 && lat <= 90 &&
                             lng >= -180 && lng <= 180;
      return hasValidCoords;
    });

    // Фильтры уже применены на бэкенде через query параметры,
    // но на всякий случай применяем их еще раз на фронтенде для надежности
    // (на случай если бэкенд не применил фильтры или вернул лишние данные)
    if (types.length > 0) {
      transformedObjects = transformedObjects.filter((obj: InfrastructureObject) => {
        return types.includes(obj.type);
      });
    }

    if (minRating) {
      const minRatingValue = parseFloat(minRating);
      transformedObjects = transformedObjects.filter(
        (obj: InfrastructureObject) => obj.averageRating !== undefined && obj.averageRating >= minRatingValue
      );
    }

    // Применяем пагинацию
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = transformedObjects.slice(start, end);
    
    const responseData = {
      data: paginated,
      total: transformedObjects.length,
      page,
      limit,
      hasMore: end < transformedObjects.length,
    };
    
    return NextResponse.json(responseData);
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
    
    // Генерируем ID для нового объекта
    const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newObject: InfrastructureObject = {
      id,
      name: body.name || 'Без названия',
      type: body.type || 'health_facilities',
      description: body.description,
      location: {
        lat: body.location?.lat || 0,
        lng: body.location?.lng || 0,
        address: body.location?.address,
      },
      averageRating: body.averageRating ?? body.average_rating ?? undefined,
      ratingsCount: body.ratingsCount ?? body.ratings_count ?? 0,
      ratedByUserIds: body.ratedByUserIds ?? body.rated_by_user_ids ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: body.createdBy || 'anonymous',
    };

    // TODO: В будущем здесь будет запрос к бэкенду для создания объекта
    // Пока возвращаем объект без сохранения
    return NextResponse.json(
      {
        data: newObject,
        message: 'Объект успешно создан',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Неверный формат данных' },
      { status: 400 }
    );
  }
}
