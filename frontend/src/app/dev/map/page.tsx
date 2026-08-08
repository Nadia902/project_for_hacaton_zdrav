'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ControlPanel } from '@/components/Map/ControlPanel';
import { ObjectDetailsPanel } from '@/components/Map/ObjectDetailsPanel';
import { NavBar } from '@/components/Layout/NavBar';
import { useDirectMapData } from '@/hooks/useDirectMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useMapStore } from '@/store/mapStore';
import { DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_ZOOM_MOBILE } from '@/lib/map';
import type { InfrastructureObject } from '@/types';

// Динамический импорт для избежания SSR проблем
const DynamicLeafletMap = dynamic(() => import('@/components/Map/LeafletMap').then(mod => ({ default: mod.LeafletMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
      <div className="text-center animate-fade-in">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto"></div>
        <p className="mt-6 text-sm text-muted-foreground font-medium">Загрузка карты...</p>
      </div>
    </div>
  ),
});

// Функция для расчета ИЗМО (Индекс здоровья МО)
function calculateHealthIndex(objects: InfrastructureObject[]): number {
  if (objects.length === 0) return 0;

  // Вычисляем средний индекс здоровья объектов
  const objectsWithIndex = objects.filter(obj => obj.healthIndex !== undefined);
  if (objectsWithIndex.length === 0) return 0;

  const sum = objectsWithIndex.reduce((acc, obj) => acc + (obj.healthIndex || 0), 0);
  return sum / objectsWithIndex.length;
}

export default function DevMapPage() {
  const isMobile = useIsMobile();
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(isMobile ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM);
  const [selectedObject, setSelectedObject] = useState<InfrastructureObject | null>(null);
  const { objects, isLoading, error } = useDirectMapData();
  const { location, getLocation } = useUserLocation();
  const { filters } = useMapStore();

  // Обновляем зум при изменении размера экрана
  useEffect(() => {
    setMapZoom(isMobile ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM);
  }, [isMobile]);

  // Фильтрация объектов на основе фильтров из store
  const filteredObjects = useMemo(() => {
    // Если нет фильтров, возвращаем все объекты
    const hasTypeFilters = filters.types && filters.types.length > 0;
    const hasRatingFilters = (filters.ratingRanges && filters.ratingRanges.length > 0) || filters.minRating !== undefined;
    
    if (!hasTypeFilters && !hasRatingFilters) {
      return objects;
    }

    let result = [...objects];

    // Фильтр по типам
    if (hasTypeFilters) {
      result = result.filter(obj => filters.types!.includes(obj.type));
    }

    // Фильтр по диапазонам рейтинга (новый способ)
    if (filters.ratingRanges && filters.ratingRanges.length > 0) {
      result = result.filter(obj => {
        if (obj.averageRating === undefined) return false;
        return filters.ratingRanges!.some(([min, max]) => 
          obj.averageRating! >= min && obj.averageRating! <= max
        );
      });
    }
    // Фильтр по минимальному рейтингу (старый способ, для обратной совместимости)
    else if (filters.minRating !== undefined) {
      result = result.filter(obj => 
        obj.averageRating !== undefined && obj.averageRating >= filters.minRating!
      );
    }

    return result;
  }, [objects, filters.types, filters.ratingRanges, filters.minRating]);

  // Расчет статистики
  const stats = useMemo(() => {
    const total = filteredObjects.length;
    const healthyFood = filteredObjects.filter(o => o.type === 'healthy_food').length;
    const medical = filteredObjects.filter(o => o.type === 'medical').length;
    const healthFacilities = filteredObjects.filter(o => o.type === 'health_facilities').length;
    
    // Расчет ИЗМО
    const healthIndex = calculateHealthIndex(filteredObjects);
    
    // Количество оценок (сумма всех ratingsCount)
    const ratingsCount = filteredObjects.reduce((sum, obj) => sum + obj.ratingsCount, 0);

    return {
      total,
      healthyFood,
      medical,
      healthFacilities,
      healthIndex,
      ratingsCount,
    };
  }, [filteredObjects]);

  const handleObjectClick = useCallback((object: InfrastructureObject) => {
    setSelectedObject(object);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Индикатор тестового режима */}
      <div className="absolute top-20 left-4 z-50 bg-yellow-500 text-black px-3 py-1 rounded-md text-xs font-bold">
        DEV MODE - Прямой запрос к серверу
      </div>
      
      {/* NavBar */}
      <NavBar />

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden z-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
            <div className="text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto"></div>
              <p className="mt-6 text-xs text-muted-foreground font-medium">
                Загрузка объектов с сервера...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
            <div className="text-center animate-fade-in">
              <p className="text-red-500 font-medium">Ошибка загрузки данных</p>
              <p className="mt-2 text-xs text-muted-foreground">{String(error)}</p>
            </div>
          </div>
        ) : (
          <>
            <DynamicLeafletMap
              objects={filteredObjects}
              onObjectClick={handleObjectClick}
              center={mapCenter}
              zoom={mapZoom}
            />
            
            {/* Панель управления (левый верхний угол) */}
            <ControlPanel />
            
            {/* Панель деталей объекта (правая боковая панель) */}
            {selectedObject && (
              <ObjectDetailsPanel
                object={selectedObject}
                onClose={() => setSelectedObject(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

