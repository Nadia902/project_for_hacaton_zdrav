'use client';

import { useEffect, useRef, useCallback } from 'react';

interface MapLayersProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: [number, number];
  zoom: number;
}

// Функция для конвертации lat/lng в тайл координаты
function latLngToTile(lat: number, lng: number, z: number) {
  const n = Math.pow(2, z);
  const tileX = Math.floor((lng + 180) / 360 * n);
  const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x: tileX, y: tileY };
}

export function MapLayers({
  canvasRef,
  containerRef,
  center,
  zoom,
}: MapLayersProps) {
  const tilesCache = useRef<Map<string, HTMLImageElement>>(new Map());

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

  // Отрисовка слоя тайлов
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    };

    updateCanvasSize();

    const z = Math.floor(zoom);
    const centerTile = latLngToTile(center[0], center[1], z);
    const tileSize = 256;

    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Вычисляем сколько тайлов нужно загрузить
    const tilesPerSide = Math.ceil(Math.max(canvas.width, canvas.height) / tileSize) + 2;
    const startX = centerTile.x - Math.floor(tilesPerSide / 2);
    const startY = centerTile.y - Math.floor(tilesPerSide / 2);

    // Загружаем и рисуем тайлы
    const tilePromises: Promise<void>[] = [];
    
    for (let dx = 0; dx < tilesPerSide; dx++) {
      for (let dy = 0; dy < tilesPerSide; dy++) {
        const x = startX + dx;
        const y = startY + dy;
        const n = Math.pow(2, z);
        
        if (x >= 0 && x < n && y >= 0 && y < n) {
          tilePromises.push(
            loadTile(x, y, z).then((tile) => {
              // Проверяем размеры canvas еще раз перед отрисовкой
              updateCanvasSize();
              const offsetX = (dx - tilesPerSide / 2) * tileSize + canvas.width / 2;
              const offsetY = (dy - tilesPerSide / 2) * tileSize + canvas.height / 2;
              ctx.drawImage(tile, offsetX, offsetY, tileSize, tileSize);
            }).catch(() => {
              // Игнорируем ошибки загрузки
            })
          );
        }
      }
    }

    // Обработка изменения размера окна
    const handleResize = () => {
      updateCanvasSize();
      // Перерисовка будет вызвана через useEffect при изменении размеров
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef, containerRef, center, zoom, loadTile]);

  return null;
}

