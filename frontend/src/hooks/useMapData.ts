'use client';

import { useQuery } from '@tanstack/react-query';
import { mapService } from '@/services/mapService';
import { useMapStore } from '@/store/mapStore';
import type { InfrastructureObject, ObjectType } from '@/types';

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
  
  return typeMap[tip] || 'health_facilities';
}

// Преобразование данных из формата бэкенда в формат фронтенда
function transformBackendObject(backendObj: any, index: number): InfrastructureObject {
  const id = backendObj.id !== undefined && backendObj.id !== null 
    ? String(backendObj.id) 
    : `obj_${index}_${Date.now()}`;
  
  // Валидация координат
  const latRaw = backendObj.latitude;
  const lngRaw = backendObj.longitude;
  
  const lat = typeof latRaw === 'string' 
    ? parseFloat(latRaw) 
    : Number(latRaw);
  const lng = typeof lngRaw === 'string'
    ? parseFloat(lngRaw)
    : Number(lngRaw);
  
  // Проверяем, что координаты валидны
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
    averageRating: backendObj.rating ?? backendObj.averageRating ?? backendObj.average_rating ?? undefined,
    ratingsCount: backendObj.ratingsCount ?? backendObj.ratings_count ?? 0,
    mo: backendObj.mo ?? undefined,
    createdAt: backendObj.added ? 
               (new Date(backendObj.added).toISOString()) : 
               new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}

export function useMapData() {
  const { filters, selectedType } = useMapStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['objects', filters, selectedType],
    queryFn: async () => {
      const requestParams = {
        ...filters,
        types: selectedType ? [selectedType] : filters.types,
      };
      
      const response = await mapService.getObjects(requestParams);
      
      // Обрабатываем оба формата ответа: объект с data или массив напрямую
      let rawObjects: any[] = [];
      
      if (Array.isArray(response)) {
        // Если ответ - массив напрямую (формат бэкенда)
        rawObjects = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Если ответ - объект с полем data
        rawObjects = response.data || [];
      }
      
      // Преобразуем объекты из формата бэкенда в формат фронтенда
      let transformedObjects: InfrastructureObject[] = rawObjects.map((obj: any, index: number) => 
        transformBackendObject(obj, index)
      );
      
      // Фильтруем объекты с невалидными координатами
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
      
      return transformedObjects;
    },
  });

  return {
    objects: data || [],
    isLoading,
    error,
    refetch,
  };
}






