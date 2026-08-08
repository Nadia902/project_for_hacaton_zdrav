'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { HeatmapData } from '@/types';

interface HeatmapLayerProps {
  data: HeatmapData[];
  radius?: number;
  maxOpacity?: number;
  minOpacity?: number;
  blur?: number;
}

export function HeatmapLayer({ 
  data, 
  radius = 25, 
  maxOpacity = 0.8, 
  minOpacity = 0.1,
  blur = 15 
}: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    // Создаем canvas для тепловой карты
    const canvas = document.createElement('canvas');
    canvas.width = map.getSize().x;
    canvas.height = map.getSize().y;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Функция для преобразования lat/lng в пиксели
    const latLngToPoint = (lat: number, lng: number) => {
      return map.latLngToContainerPoint([lat, lng]);
    };

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем тепловую карту
    data.forEach((point) => {
      const pixel = latLngToPoint(point.lat, point.lng);
      const intensity = point.value / 100; // Нормализуем значение от 0 до 1
      
      // Создаем градиент для каждой точки
      const gradient = ctx.createRadialGradient(
        pixel.x, pixel.y, 0,
        pixel.x, pixel.y, radius
      );
      
      const opacity = minOpacity + (maxOpacity - minOpacity) * intensity;
      gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Применяем blur эффект
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Создаем изображение из canvas
    const imageUrl = canvas.toDataURL();
    const imageBounds = map.getBounds();
    
    // Создаем слой изображения
    const imageOverlay = L.imageOverlay(imageUrl, imageBounds, {
      opacity: 0.6,
      interactive: false,
    });

    imageOverlay.addTo(map);
    layerRef.current = imageOverlay;

    // Обновляем при изменении карты
    const updateHeatmap = () => {
      if (!layerRef.current) return;
      
      canvas.width = map.getSize().x;
      canvas.height = map.getSize().y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      data.forEach((point) => {
        const pixel = latLngToPoint(point.lat, point.lng);
        const intensity = point.value / 100;
        
        const gradient = ctx.createRadialGradient(
          pixel.x, pixel.y, 0,
          pixel.x, pixel.y, radius
        );
        
        const opacity = minOpacity + (maxOpacity - minOpacity) * intensity;
        gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 165, 0, ${opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const newImageUrl = canvas.toDataURL();
      (layerRef.current as L.ImageOverlay).setUrl(newImageUrl);
      (layerRef.current as L.ImageOverlay).setBounds(map.getBounds());
    };

    map.on('moveend', updateHeatmap);
    map.on('zoomend', updateHeatmap);
    map.on('resize', updateHeatmap);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      map.off('moveend', updateHeatmap);
      map.off('zoomend', updateHeatmap);
      map.off('resize', updateHeatmap);
    };
  }, [map, data, radius, maxOpacity, minOpacity, blur]);

  return null;
}




