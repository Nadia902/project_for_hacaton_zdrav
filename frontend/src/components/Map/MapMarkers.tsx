'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { InfrastructureObject } from '@/types';
import { getMarkerColor, getMarkerIconSvgFull } from '@/lib/map';

interface MapMarkersProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  objects: InfrastructureObject[];
  center: [number, number];
  zoom: number;
  onMarkerClick: (object: InfrastructureObject) => void;
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

export function MapMarkers({
  canvasRef,
  containerRef,
  objects,
  center,
  zoom,
  onMarkerClick,
}: MapMarkersProps) {
  const markersRef = useRef<Map<string, { x: number; y: number; object: InfrastructureObject }>>(new Map());
  const iconsCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Загрузка SVG иконки как изображения
  const loadIcon = useCallback((type: string, size: number = 12): Promise<HTMLImageElement> => {
    const cacheKey = `${type}_${size}`;
    const cached = iconsCache.current.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const svg = getMarkerIconSvgFull(type, size);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        iconsCache.current.set(cacheKey, img);
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });
  }, []);

  // Отрисовка маркеров (рисуем поверх тайлов)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Небольшая задержка, чтобы маркеры рисовались после тайлов
    const timeoutId = setTimeout(async () => {
      const markers = new Map<string, { x: number; y: number; object: InfrastructureObject }>();
      const markerData: Array<{ pixel: { x: number; y: number }; obj: InfrastructureObject }> = [];
      
      // Собираем данные о маркерах
      objects.forEach((obj) => {
        const pixel = latLngToPixel(
          obj.location.lat,
          obj.location.lng,
          center,
          zoom,
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
      });

      // Загружаем все необходимые иконки
      const uniqueTypes = new Set(objects.map(obj => obj.type));
      const iconSize = 12;
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
        
        // Рисуем тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(pixel.x + 2, pixel.y + 2, 12, 0, Math.PI * 2);
        ctx.fill();

        // Рисуем основной маркер
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Иконка типа объекта
        const icon = iconsMap.get(obj.type);
        if (icon) {
          ctx.drawImage(icon, pixel.x - iconSize / 2, pixel.y - iconSize / 2, iconSize, iconSize);
        }
      });

      markersRef.current = markers;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [canvasRef, containerRef, objects, center, zoom, loadIcon]);

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
          onMarkerClick(marker.object);
          mouseDownPos = null;
          return;
        }
      }

      mouseDownPos = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [onMarkerClick]);

  return null;
}

