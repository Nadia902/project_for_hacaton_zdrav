'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { InfrastructureObject } from '@/types';
import { MapControls } from './MapControls';
import { TULA_REGION_BOUNDS, MIN_ZOOM, MAX_ZOOM, getMarkerColor, getMarkerIconSvgFull, preloadIcons, clearIconCache } from '@/lib/map';

interface MapContainerProps {
  objects: InfrastructureObject[];
  onObjectClick?: (object: InfrastructureObject) => void;
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
}

// Функция для конвертации lat/lng в тайл координаты
function latLngToTile(lat: number, lng: number, z: number) {
  const n = Math.pow(2, z);
  const tileX = Math.floor((lng + 180) / 360 * n);
  const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x: tileX, y: tileY };
}

// Функция для конвертации lat/lng в пиксели на экране
function latLngToPixel(
  lat: number,
  lng: number,
  center: [number, number],
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const centerTile = latLngToTile(center[0], center[1], zoom);
  const pointTile = latLngToTile(lat, lng, zoom);
  const tileSize = 256;
  const pixelX = (pointTile.x - centerTile.x) * tileSize + canvasWidth / 2;
  const pixelY = (pointTile.y - centerTile.y) * tileSize + canvasHeight / 2;
  return { x: pixelX, y: pixelY };
}

// Функция для конвертации пикселей в lat/lng
function pixelToLatLng(
  x: number,
  y: number,
  center: [number, number],
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
): [number, number] {
  const tileSize = 256;
  const n = Math.pow(2, zoom);
  const centerTile = latLngToTile(center[0], center[1], zoom);
  
  const deltaX = (x - canvasWidth / 2) / tileSize;
  const deltaY = (y - canvasHeight / 2) / tileSize;
  
  const tileX = centerTile.x + deltaX;
  const tileY = centerTile.y + deltaY;
  
  const lng = (tileX / n) * 360 - 180;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n))) * 180 / Math.PI;
  
  return [lat, lng];
}

export function MapContainer({
  objects,
  onObjectClick,
  onMapClick,
  center = [53.935683, 37.5690433],
  zoom = 8,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tilesCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const iconsCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const markersRef = useRef<Map<string, { x: number; y: number; object: InfrastructureObject }>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  
  const [mapState, setMapState] = useState({
    center,
    zoom,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Предзагрузка иконок при монтировании
  useEffect(() => {
    // Очищаем кэш перед предзагрузкой, чтобы получить свежие иконки
    clearIconCache();
    preloadIcons();
  }, []);

  // Ограничение границ Тульской области с учетом зума и видимой области
  const constrainBounds = useCallback((lat: number, lng: number, zoom: number): [number, number] => {
    if (!containerRef.current) {
      // Если контейнер еще не готов, используем простые ограничения
      return [
        Math.max(TULA_REGION_BOUNDS.south, Math.min(TULA_REGION_BOUNDS.north, lat)),
        Math.max(TULA_REGION_BOUNDS.west, Math.min(TULA_REGION_BOUNDS.east, lng))
      ];
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const tileSize = 256;
    
    // Вычисляем видимую область в градусах
    // При зуме z, один тайл покрывает 360 / 2^z градусов по долготе
    const degreesPerTile = 360 / Math.pow(2, zoom);
    const visibleWidthDegrees = (width / tileSize) * degreesPerTile;
    
    // Для широты учитываем cos(lat), так как меридианы сходятся к полюсам
    const latRad = lat * Math.PI / 180;
    const visibleHeightDegrees = (height / tileSize) * degreesPerTile / Math.cos(latRad);
    
    // Вычисляем минимальные и максимальные допустимые координаты центра
    // так, чтобы видимая область не выходила за границы
    const minLat = TULA_REGION_BOUNDS.south + visibleHeightDegrees / 2;
    const maxLat = TULA_REGION_BOUNDS.north - visibleHeightDegrees / 2;
    const minLng = TULA_REGION_BOUNDS.west + visibleWidthDegrees / 2;
    const maxLng = TULA_REGION_BOUNDS.east - visibleWidthDegrees / 2;
    
    // Если видимая область больше границ области, центрируем по центру области
    const regionCenterLat = (TULA_REGION_BOUNDS.south + TULA_REGION_BOUNDS.north) / 2;
    const regionCenterLng = (TULA_REGION_BOUNDS.west + TULA_REGION_BOUNDS.east) / 2;
    
    // Ограничиваем центр с учетом видимой области
    let constrainedLat = lat;
    if (minLat > maxLat) {
      // Видимая область больше границ - центрируем
      constrainedLat = regionCenterLat;
    } else {
      // Ограничиваем в допустимых пределах
      constrainedLat = Math.max(minLat, Math.min(maxLat, lat));
    }
    
    let constrainedLng = lng;
    if (minLng > maxLng) {
      // Видимая область больше границ - центрируем
      constrainedLng = regionCenterLng;
    } else {
      // Ограничиваем в допустимых пределах
      constrainedLng = Math.max(minLng, Math.min(maxLng, lng));
    }
    
    return [constrainedLat, constrainedLng];
  }, []);

  // Обновление состояния карты с ограничениями
  const updateMapState = useCallback((updates: Partial<typeof mapState>) => {
    setMapState((prev) => {
      let newState = { ...prev, ...updates };
      
      // Сначала обновляем зум, если он изменился
      if (updates.zoom !== undefined) {
        newState.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, updates.zoom));
      }
      
      // Затем ограничиваем центр с учетом нового зума
      if (updates.center) {
        newState.center = constrainBounds(
          updates.center[0], 
          updates.center[1], 
          newState.zoom
        );
      } else if (updates.zoom !== undefined) {
        // Если изменился только зум, нужно пересчитать ограничения для текущего центра
        newState.center = constrainBounds(
          newState.center[0],
          newState.center[1],
          newState.zoom
        );
      }
      
      return newState;
    });
  }, [constrainBounds]);

  // Загрузка тайла
  const loadTile = useCallback((x: number, y: number, z: number): Promise<HTMLImageElement> => {
    const cacheKey = `${z}/${x}/${y}`;
    const cached = tilesCache.current.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        tilesCache.current.set(cacheKey, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    });
  }, []);

  // Загрузка SVG иконки как изображения
  const loadIcon = useCallback((type: string, size: number = 14): Promise<HTMLImageElement> => {
    const cacheKey = `${type}_${size}`;
    const cached = iconsCache.current.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const svg = getMarkerIconSvgFull(type, size);
      
      // Убеждаемся, что SVG валидный
      if (!svg || !svg.includes('<svg')) {
        reject(new Error(`Invalid SVG for type ${type}`));
        return;
      }
      
      // Создаем blob с правильным типом
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        iconsCache.current.set(cacheKey, img);
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      img.src = url;
    });
  }, []);

  // Вспомогательная функция для осветления цвета
  const lightenColor = useCallback((color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }, []);

  // Единая функция отрисовки карты
  const drawMap = useCallback(async () => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const z = Math.floor(mapState.zoom);
    const centerTile = latLngToTile(mapState.center[0], mapState.center[1], z);
    const tileSize = 256;

    // Вычисляем сколько тайлов нужно загрузить
    const tilesPerSide = Math.ceil(Math.max(canvas.width, canvas.height) / tileSize) + 2;
    const startX = centerTile.x - Math.floor(tilesPerSide / 2);
    const startY = centerTile.y - Math.floor(tilesPerSide / 2);

    // Загружаем все тайлы
    const tilePromises: Promise<{ tile: HTMLImageElement; dx: number; dy: number } | null>[] = [];
    
    for (let dx = 0; dx < tilesPerSide; dx++) {
      for (let dy = 0; dy < tilesPerSide; dy++) {
        const x = startX + dx;
        const y = startY + dy;
        const n = Math.pow(2, z);
        
        if (x >= 0 && x < n && y >= 0 && y < n) {
          tilePromises.push(
            loadTile(x, y, z)
              .then((tile) => ({ tile, dx, dy }))
              .catch(() => null)
          );
        }
      }
    }

    // Ждем загрузки всех тайлов и рисуем их
    const loadedTiles = (await Promise.all(tilePromises)).filter(
      (result): result is { tile: HTMLImageElement; dx: number; dy: number } => result !== null
    );
    
    // Рисуем тайлы
    loadedTiles.forEach((result) => {
      const offsetX = (result.dx - tilesPerSide / 2) * tileSize + canvas.width / 2;
      const offsetY = (result.dy - tilesPerSide / 2) * tileSize + canvas.height / 2;
      ctx.drawImage(result.tile, offsetX, offsetY, tileSize, tileSize);
    });

    // Рисуем маркеры поверх тайлов
    const markers = new Map<string, { x: number; y: number; object: InfrastructureObject }>();
    const markerData: Array<{ pixel: { x: number; y: number }; obj: InfrastructureObject }> = [];
    
    // Собираем данные о маркерах и загружаем иконки
    const uniqueTypes = new Set<string>();
    objects.forEach((obj) => {
      const pixel = latLngToPixel(
        obj.location.lat,
        obj.location.lng,
        mapState.center,
        mapState.zoom,
        canvas.width,
        canvas.height
      );

      // Проверяем, виден ли маркер на экране
      if (pixel.x < -50 || pixel.x > canvas.width + 50 || 
          pixel.y < -50 || pixel.y > canvas.height + 50) {
        return;
      }

      markers.set(obj.id, { x: pixel.x, y: pixel.y, object: obj });
      markerData.push({ pixel, obj });
      uniqueTypes.add(obj.type);
    });

    // Загружаем все необходимые иконки
    const iconSize = 14;
    const iconPromises = Array.from(uniqueTypes).map(type => 
      loadIcon(type, iconSize).catch(() => null)
    );
    const loadedIcons = await Promise.all(iconPromises);
    const iconsMap = new Map<string, HTMLImageElement | null>();
    Array.from(uniqueTypes).forEach((type, index) => {
      iconsMap.set(type, loadedIcons[index]);
    });

    // Рисуем маркеры
    markerData.forEach(({ pixel, obj }) => {
      // Цвет маркера по рейтингу
      const color = getMarkerColor(obj.averageRating);
      
      // Рисуем внешнюю тень (более мягкая)
      const shadowGradient = ctx.createRadialGradient(
        pixel.x, pixel.y, 0,
        pixel.x, pixel.y, 18
      );
      shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
      shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Рисуем внутреннюю тень для глубины
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(pixel.x + 1, pixel.y + 1, 14, 0, Math.PI * 2);
      ctx.fill();

      // Рисуем градиент для маркера
      const lightenedColor = lightenColor(color, 20);
      const markerGradient = ctx.createRadialGradient(
        pixel.x - 3, pixel.y - 3, 0,
        pixel.x, pixel.y, 14
      );
      markerGradient.addColorStop(0, lightenedColor);
      markerGradient.addColorStop(1, color);
      ctx.fillStyle = markerGradient;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 14, 0, Math.PI * 2);
      ctx.fill();
      
      // Внешняя обводка (белая)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Внутренняя обводка для контраста
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Иконка типа объекта
      const icon = iconsMap.get(obj.type);
      if (icon) {
        // Рисуем иконку с небольшой тенью
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(icon, pixel.x - iconSize / 2 + 0.5, pixel.y - iconSize / 2 + 0.5, iconSize, iconSize);
        ctx.globalAlpha = 1;
        ctx.drawImage(icon, pixel.x - iconSize / 2, pixel.y - iconSize / 2, iconSize, iconSize);
        ctx.restore();
      }
    });

    markersRef.current = markers;
  }, [mapState, objects, loadTile, loadIcon, lightenColor]);

  // Отрисовка карты при изменении состояния
  useEffect(() => {
    // Отменяем предыдущий кадр анимации, если он есть
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Используем requestAnimationFrame для плавной отрисовки
    animationFrameRef.current = requestAnimationFrame(() => {
      drawMap();
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawMap]);

  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        drawMap();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawMap]);

  // Обработка клика на маркер
  const handleMarkerClick = useCallback((object: InfrastructureObject) => {
    onObjectClick?.(object);
  }, [onObjectClick]);

  // Обработка событий мыши для перетаскивания
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Не начинаем перетаскивание, если кликнули на попап
      const target = e.target as HTMLElement;
      if (target.closest('[data-popup]')) {
        return;
      }
      
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        
        // Если перемещение небольшое, это может быть клик, не перетаскиваем
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          return;
        }
        
        const tileSize = 256;
        const scale = Math.pow(2, mapState.zoom);
        const latDelta = -dy / (tileSize * scale) * 360;
        const lngDelta = dx / (tileSize * scale * Math.cos(mapState.center[0] * Math.PI / 180)) * 360;
        
        updateMapState({
          center: [
            mapState.center[0] + latDelta,
            mapState.center[1] + lngDelta,
          ] as [number, number],
        });
        
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      if (canvas) canvas.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      updateMapState({
        zoom: mapState.zoom + delta,
      });
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, mapState, updateMapState]);

  // Обработка кликов по маркерам
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mouseDownPos: { x: number; y: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseDownPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleClick = (e: MouseEvent) => {
      // Проверяем, что это был клик, а не перетаскивание
      if (!mouseDownPos) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Если мышь переместилась больше чем на 5 пикселей, это не клик
      const moved = Math.abs(x - mouseDownPos.x) > 5 || Math.abs(y - mouseDownPos.y) > 5;
      if (moved) {
        mouseDownPos = null;
        return;
      }

      // Проверяем клик по маркеру
      for (const [id, marker] of markersRef.current.entries()) {
        const distance = Math.sqrt(
          Math.pow(x - marker.x, 2) + Math.pow(y - marker.y, 2)
        );
        
        if (distance <= 15) {
          e.stopPropagation();
          handleMarkerClick(marker.object);
          mouseDownPos = null;
          return;
        }
      }

      // Если клик не по маркеру и есть обработчик клика по карте
      if (onMapClick && containerRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const [lat, lng] = pixelToLatLng(
          x,
          y,
          mapState.center,
          mapState.zoom,
          rect.width,
          rect.height
        );
        onMapClick(lat, lng);
      }

      mouseDownPos = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [handleMarkerClick, onMapClick, mapState]);


  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden"
    >
      {/* Декоративный градиентный оверлей для глубины */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none z-0" />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 transition-opacity duration-300"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          imageRendering: 'crisp-edges',
        }}
      />
      
      <MapControls
        zoom={mapState.zoom}
        onZoomChange={(newZoom) => updateMapState({ zoom: newZoom })}
        onCenterToTula={() => updateMapState({ center: [54.2048, 37.6173], zoom: 12 })}
      />
    </div>
  );
}
