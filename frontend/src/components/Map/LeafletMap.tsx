'use client';

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Импортируем CSS для кластеризации
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { InfrastructureObject, HeatmapData } from '@/types';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MIN_ZOOM_MOBILE, MAX_ZOOM, TULA_REGION_BOUNDS, getMarkerColor, getMarkerIconSvgFull, objectsToHeatmapData } from '@/lib/map';
import { useIsMobile } from '@/hooks/useIsMobile';
import { GeoJSONLayer } from './GeoJSONLayer';
import { TULA_MUNICIPALITIES_GEOJSON, getMunicipalityStyle } from '@/lib/geojson';
import { LayerSwitcher, type MapLayer } from './LayerSwitcher';
import { HeatmapLayer } from './HeatmapLayer';
import { MunicipalityHealthLayer } from './MunicipalityHealthLayer';
import { MaskLayer } from './MaskLayer';

// Исправление иконок по умолчанию для Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});



// Компонент для обновления центра карты
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

// Компонент для исправления размера карты при изменении размеров контейнера
function MapSizeFixer() {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Исправляем размер сразу после монтирования
    const fixSize = () => {
      map.invalidateSize();
    };
    
    // Небольшая задержка для мобильных устройств
    if (isMobile) {
      setTimeout(fixSize, 50);
      setTimeout(fixSize, 200);
      setTimeout(fixSize, 500);
    } else {
      setTimeout(fixSize, 50);
    }
    
    // Также исправляем при изменении размера окна
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    
    // Обработка изменения ориентации на мобильных
    const handleOrientationChange = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    };
    
    window.addEventListener('resize', handleResize);
    if (isMobile) {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isMobile) {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, [map, isMobile]);
  
  return null;
}

// Компонент для инициализации карты (установка z-index)
function MapInitializer({ onInitialized }: { onInitialized?: () => void }) {
  const map = useMap();
  
  useEffect(() => {
    // Устанавливаем низкий z-index для карты
    const mapContainer = map.getContainer();
    if (mapContainer) {
      mapContainer.style.zIndex = '0';
    }
    onInitialized?.();
  }, [map, onInitialized]);
  
  return null;
}

// Компонент для обработки кликов по карте
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Компонент кластеризации маркеров
function MarkerClusterWrapper({ 
  objects,
  onObjectClick 
}: { 
  objects: InfrastructureObject[];
  onObjectClick?: (object: InfrastructureObject) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const isInitializedRef = useRef(false);

  // Функция для добавления маркеров в кластер
  const addMarkersToCluster = useCallback(() => {
    if (!clusterGroupRef.current) {
      return;
    }
    
    if (!objects.length) {
      return;
    }

    // Удаляем старые маркеры
    markersRef.current.forEach(marker => {
      clusterGroupRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Создаем новые маркеры
    let validMarkers = 0;
    let invalidMarkers = 0;
    objects.forEach((object) => {
      if (!object.location?.lat || !object.location?.lng) {
        invalidMarkers++;
        return;
      }
      validMarkers++;

      const color = getMarkerColor(object.averageRating);
      const iconSvg = getMarkerIconSvgFull(object.type, 12);
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            <div style="color: white; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center;">
              ${iconSvg}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([object.location.lat, object.location.lng], { icon });
      
      marker.on('click', () => {
        onObjectClick?.(object);
      });

      clusterGroupRef.current.addLayer(marker);
      markersRef.current.push(marker);
    });
  }, [objects, onObjectClick]);

  // Инициализация кластер группы
  useEffect(() => {
    if (!map || typeof window === 'undefined' || isInitializedRef.current) return;

    // Импортируем leaflet.markercluster
    import('leaflet.markercluster').then(() => {
      // После импорта leaflet.markercluster добавляет MarkerClusterGroup в L namespace
      const MarkerClusterGroup = (L as any).MarkerClusterGroup;
      
      if (!MarkerClusterGroup) {
        return;
      }

      // Создаем кластер группу
      const clusterGroup = new MarkerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count > 100) size = 'large';
          else if (count > 20) size = 'medium';
          
          return L.divIcon({
            html: `<div class="marker-cluster marker-cluster-${size}">
              <span>${count}</span>
            </div>`,
            className: 'marker-cluster-container',
            iconSize: L.point(40, 40),
          });
        },
      });

      clusterGroupRef.current = clusterGroup;
      map.addLayer(clusterGroup);
      isInitializedRef.current = true;

      // Добавляем маркеры после создания кластер группы
      // Используем setTimeout для гарантии, что кластер группа полностью инициализирована
      setTimeout(() => {
        addMarkersToCluster();
      }, 100);
    }).catch(() => {
      // Error loading leaflet.markercluster
    });

    return () => {
      if (clusterGroupRef.current) {
        // Удаляем все маркеры перед удалением кластер группы
        markersRef.current.forEach(marker => {
          clusterGroupRef.current?.removeLayer(marker);
        });
        markersRef.current = [];
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [map, addMarkersToCluster]);

  // Обновляем маркеры при изменении объектов
  useEffect(() => {
    if (isInitializedRef.current && clusterGroupRef.current) {
      addMarkersToCluster();
    }
  }, [addMarkersToCluster]);

  return null;
}


// Компонент маркера с кастомной иконкой
function CustomMarker({ object, onClick }: { object: InfrastructureObject; onClick?: () => void }) {
  const markerRef = useRef<L.Marker>(null);
  
  const icon = useMemo(() => {
    const color = getMarkerColor(object.averageRating);
    const iconSvg = getMarkerIconSvgFull(object.type, 12);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="color: white; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center;">
            ${iconSvg}
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [object.averageRating, object.type]);

  return (
    <Marker
      ref={markerRef}
      position={[object.location.lat, object.location.lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          onClick?.();
        },
      }}
    />
  );
}

interface LeafletMapProps {
  objects: InfrastructureObject[];
  onObjectClick?: (object: InfrastructureObject) => void;
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  showLayerSwitcher?: boolean;
  positionMarker?: [number, number] | null;
}

// Компонент маркера позиции
function PositionMarker({ position }: { position: [number, number] }) {
  const icon = useMemo(() => {
    // Используем яркий цвет для лучшей видимости
    return L.divIcon({
      className: 'position-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border: 4px solid #3b82f6;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(59, 130, 246, 0.6);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  return <Marker position={position} icon={icon} interactive={false} zIndexOffset={1000} />;
}

export function LeafletMap({
  objects,
  onObjectClick,
  onMapClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  showLayerSwitcher = true,
  positionMarker,
}: LeafletMapProps) {
  const isMobile = useIsMobile();
  // Используем useRef для гарантии одного рендера карты
  const mapKeyRef = useRef<string>('leaflet-map-instance');
  
  // Состояние текущего слоя
  const [currentLayer, setCurrentLayer] = useState<MapLayer>('objects');
  
  // Мемоизируем колбэк для предотвращения пересоздания маркеров
  const handleObjectClick = useCallback((object: InfrastructureObject) => {
    onObjectClick?.(object);
  }, [onObjectClick]);

  // Мемоизируем список ID объектов для проверки изменений
  const objectsIds = useMemo(() => objects.map(obj => obj.id).join(','), [objects]);

  // Преобразуем объекты в данные для тепловой карты
  const heatmapData = useMemo(() => {
    if (currentLayer === 'izmo') {
      return objectsToHeatmapData(objects);
    }
    return [];
  }, [objects, currentLayer]);

  // Вычисляем границы видимой области при начальном зуме
  // Используем границы Тульской области как ограничение
  // На мобильных устройствах делаем ограничения более мягкими или убираем их
  const maxBounds = useMemo(() => {
    if (isMobile) {
      // На мобильных не устанавливаем жесткие границы, чтобы карта могла свободно масштабироваться
      return undefined;
    }
    return [
      [TULA_REGION_BOUNDS.south, TULA_REGION_BOUNDS.west] as [number, number],
      [TULA_REGION_BOUNDS.north, TULA_REGION_BOUNDS.east] as [number, number],
    ];
  }, [isMobile]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        key={mapKeyRef.current}
        center={center}
        zoom={zoom}
        minZoom={isMobile ? MIN_ZOOM_MOBILE : MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={maxBounds}
        maxBoundsViscosity={isMobile ? 0.5 : 1.0}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInitializer />
        <MapSizeFixer />
        <MapUpdater center={center} zoom={zoom} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        
        {/* Слой затемнения для областей за пределами полигонов */}
        <MaskLayer
          data={TULA_MUNICIPALITIES_GEOJSON}
          opacity={0.4}
          color="#000000"
        />
        
        {/* Полигоны муниципальных образований с ИЗМО */}
        {currentLayer === 'izmo' ? (
          <MunicipalityHealthLayer
            data={TULA_MUNICIPALITIES_GEOJSON}
            objects={objects}
          />
        ) : (
          <GeoJSONLayer
            data={TULA_MUNICIPALITIES_GEOJSON}
            style={getMunicipalityStyle}
          />
        )}
        
        {/* Тепловая карта (можно добавить отдельный слой для тепловой карты) */}
        {/* {currentLayer === 'heatmap' && heatmapData.length > 0 && (
          <HeatmapLayer data={heatmapData} />
        )} */}
        
        {/* Маркеры объектов с кластеризацией */}
        {currentLayer === 'objects' && (
          <MarkerClusterWrapper
            objects={objects}
            onObjectClick={handleObjectClick}
          />
        )}
        
        {/* Маркер выбранной позиции */}
        {positionMarker && (
          <PositionMarker position={positionMarker} />
        )}
      </MapContainer>
      
      {/* Переключатель слоев */}
      {showLayerSwitcher && (
        <LayerSwitcher
          currentLayer={currentLayer}
          onLayerChange={setCurrentLayer}
        />
      )}
    </div>
  );
}

