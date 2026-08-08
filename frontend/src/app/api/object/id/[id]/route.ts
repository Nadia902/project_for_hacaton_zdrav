import { NextRequest, NextResponse } from 'next/server';
import type { InfrastructureObject, ObjectDetails } from '@/types';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'https://sololevelingzdravmaps.ru/api';

// Функция для преобразования объекта из формата бэкенда
function transformBackendObject(backendObj: any, idFromUrl: string): InfrastructureObject {
  // Используем ID из URL параметра, так как API может не возвращать ID в теле ответа
  const id = backendObj.id !== undefined && backendObj.id !== null 
    ? String(backendObj.id) 
    : idFromUrl;

  const typeMap: Record<string, any> = {
    'education': 'education',
    'medical': 'medical',
    'health_facilities': 'health_facilities',
    'healthy_food': 'healthy_food',
    'alcohol_tobacco': 'alcohol_tobacco',
    'industrial': 'industrial',
    'waste_collection': 'waste_collection',
  };

  // Валидация координат (если они есть в ответе)
  const lat = backendObj.latitude !== undefined 
    ? (typeof backendObj.latitude === 'string' ? parseFloat(backendObj.latitude) : Number(backendObj.latitude))
    : 0;
  const lng = backendObj.longitude !== undefined
    ? (typeof backendObj.longitude === 'string' ? parseFloat(backendObj.longitude) : Number(backendObj.longitude))
    : 0;
  
  const validLat = !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : 0;
  const validLng = !isNaN(lng) && lng >= -180 && lng <= 180 ? lng : 0;

  return {
    id,
    name: backendObj.name || 'Без названия',
    type: typeMap[backendObj.tip] || 'health_facilities',
    location: {
      lat: validLat,
      lng: validLng,
      address: backendObj.adres || undefined,
    },
    averageRating: undefined,
    ratingsCount: 0,
    ratedByUserIds: undefined,
    mo: backendObj.mo ?? undefined,
    createdAt: backendObj.added 
      ? (new Date(backendObj.added).toISOString()) 
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Используем правильный формат API endpoint: /object/id/[id]
    const response = await fetch(`${REMOTE_API_URL}/object/id/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Объект не найден' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch object' },
        { status: response.status }
      );
    }

    const backendObj = await response.json();
    
    // Преобразуем объект из формата бэкенда
    const object = transformBackendObject(backendObj, id);

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

