'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { ControlPanel } from '@/components/Map/ControlPanel';
import { ObjectDetailsPanel } from '@/components/Map/ObjectDetailsPanel';
import { NavBar } from '@/components/Layout/NavBar';
import { useMapData } from '@/hooks/useMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useMapStore } from '@/store/mapStore';
import { DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_ZOOM_MOBILE } from '@/lib/map';
import { setAuthToken } from '@/lib/tokenStorage';
import { useMunicipalityHealthIndex } from '@/hooks/useMunicipalityHealthIndex';
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

// Маппинг муниципалитетов
const MUNICIPALITY_LABELS: Record<string, string> = {
  all: 'Все МО',
  tula: 'г. Тула',
  novomoskovsk: 'г. Новомосковск',
  aleksin: 'г. Алексин',
  efremov: 'г. Ефремов',
  shchekino: 'г. Щёкино',
};

// Примерные границы муниципалитетов (для фильтрации)
// В реальном приложении это должно приходить с бэкенда
const MUNICIPALITY_BOUNDS: Record<string, { north: number; south: number; east: number; west: number }> = {
  tula: { north: 54.3, south: 54.1, east: 37.7, west: 37.5 },
  novomoskovsk: { north: 54.1, south: 53.9, east: 38.3, west: 38.1 },
  // Добавьте другие муниципалитеты по необходимости
};

// Функция для расчета ИЗМО (Индекс здоровья МО) - DEPRECATED
// Теперь используется useMunicipalityHealthIndex для получения данных из API
function calculateHealthIndex(objects: InfrastructureObject[]): number {
  if (objects.length === 0) return 0;

  // Вычисляем средний индекс здоровья объектов
  const objectsWithIndex = objects.filter(obj => obj.healthIndex !== undefined);
  if (objectsWithIndex.length === 0) return 0;

  const sum = objectsWithIndex.reduce((acc, obj) => acc + (obj.healthIndex || 0), 0);
  return sum / objectsWithIndex.length;
}

// Компонент для обработки OAuth токена (должен быть обернут в Suspense)
function OAuthTokenHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Сохраняем токен в localStorage
      setAuthToken(token);
      
      // Очищаем токен из URL для безопасности
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('token');
      newSearchParams.delete('user_id'); // Также удаляем user_id если есть
      
      const newUrl = newSearchParams.toString() 
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      
      // Заменяем URL без перезагрузки страницы
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}

function MapPageContent() {
  const isMobile = useIsMobile();
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(isMobile ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM);
  const [selectedObject, setSelectedObject] = useState<InfrastructureObject | null>(null);
  const { objects, isLoading } = useMapData();
  const { location, getLocation } = useUserLocation();
  const { filters } = useMapStore();
  const { getHealthIndex, isLoading: isLoadingHealthIndex } = useMunicipalityHealthIndex();


  // Обновляем зум при изменении размера экрана
  useEffect(() => {
    setMapZoom(isMobile ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM);
  }, [isMobile]);

  // Фильтрация объектов на основе фильтров из store
  const filteredObjects = useMemo(() => {
    // Если нет фильтров, возвращаем все объекты
    const hasTypeFilters = filters.types && filters.types.length > 0;
    // ВРЕМЕННО: фильтр по рейтингу отключен
    // const hasRatingFilters = (filters.ratingRanges && filters.ratingRanges.length > 0) || filters.minRating !== undefined;
    const hasRatingFilters = false; // Временно отключено
    
    if (!hasTypeFilters && !hasRatingFilters) {
      return objects;
    }

    let result = [...objects];

    // Фильтр по типам
    if (hasTypeFilters) {
      const requestedTypes = filters.types!;
      
      result = result.filter(obj => {
        const matches = requestedTypes.includes(obj.type);
        return matches;
      });
    }

    // Фильтр по диапазонам рейтинга (новый способ) - ВРЕМЕННО ОТКЛЮЧЕН
    // TODO: Включить обратно, когда объекты будут иметь рейтинги
    /*
    if (filters.ratingRanges && filters.ratingRanges.length > 0) {
      const beforeRatingFilter = result.length;
      // Сохраняем объекты ДО фильтрации для анализа
      const objectsBeforeFilter = [...result];
      const objectsWithRatingsBefore = objectsBeforeFilter.filter(obj => obj.averageRating !== undefined);
      const objectsWithoutRatingsBefore = objectsBeforeFilter.filter(obj => obj.averageRating === undefined);
      
      result = result.filter(obj => {
        // Если у объекта нет рейтинга, исключаем его из результатов
        // (так как фильтр по рейтингу означает, что мы хотим видеть только объекты с рейтингом)
        if (obj.averageRating === undefined) {
          return false;
        }
        // Проверяем, попадает ли рейтинг в один из диапазонов
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
    */
    
    return result;
  }, [objects, filters.types, filters.ratingRanges, filters.minRating]);

  // Расчет статистики
  const stats = useMemo(() => {
    const total = filteredObjects.length;
    const healthyFood = filteredObjects.filter(o => o.type === 'healthy_food').length;
    const medical = filteredObjects.filter(o => o.type === 'medical').length;
    const healthFacilities = filteredObjects.filter(o => o.type === 'health_facilities').length;
    
    // ИЗМО теперь получается из API, но для общего ИЗМО по всем объектам используем fallback
    // В реальности ИЗМО должен быть привязан к конкретному муниципалитету
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
      {/* NavBar */}
      <NavBar />

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden z-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
            <div className="text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto"></div>
              <p className="mt-6 text-xs text-muted-foreground font-medium">
                Загрузка объектов...
              </p>
            </div>
          </div>
        ) : (
          <>
            <DynamicLeafletMap
              objects={filteredObjects}
              onObjectClick={handleObjectClick}
              center={mapCenter}
              zoom={mapZoom}
              showLayerSwitcher={true}
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

export default function MapPage() {
  return (
    <>
      <Suspense fallback={null}>
        <OAuthTokenHandler />
      </Suspense>
      <MapPageContent />
    </>
  );
}



