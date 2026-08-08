'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJSON } from 'geojson';

interface MaskLayerProps {
  data: GeoJSON;
  opacity?: number;
  color?: string;
}

export function MaskLayer({ data, opacity = 0.5, color = '#000000' }: MaskLayerProps) {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    const updateMask = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Заливаем весь canvas затемнением
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Вырезаем области полигонов (делаем их прозрачными)
      if (data.type === 'FeatureCollection') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;

        data.features.forEach((feature) => {
          if (feature.geometry.type === 'Polygon') {
            const coordinates = (feature.geometry as GeoJSON.Polygon).coordinates;
            const outerRing = coordinates[0];

            ctx.beginPath();
            const firstPoint = map.latLngToContainerPoint([outerRing[0][1], outerRing[0][0]]);
            ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < outerRing.length; i++) {
              const [lng, lat] = outerRing[i];
              const point = map.latLngToContainerPoint([lat, lng]);
              ctx.lineTo(point.x, point.y);
            }

            ctx.closePath();
            ctx.fill();
          }
        });
      }

      // Обновляем bounds для imageOverlay
      const bounds = map.getBounds();
      if (overlayRef.current) {
        overlayRef.current.setUrl(canvas.toDataURL());
        overlayRef.current.setBounds(bounds);
      } else {
        const imageOverlay = L.imageOverlay(canvas.toDataURL(), bounds, {
          opacity: 1,
          interactive: false,
          zIndex: 500, // Выше тайлов, но ниже маркеров
        });
        imageOverlay.addTo(map);
        overlayRef.current = imageOverlay;
      }
    };

    // Обновляем маску при изменении карты
    updateMask();
    map.on('moveend', updateMask);
    map.on('zoomend', updateMask);
    map.on('resize', updateMask);

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
      map.off('moveend', updateMask);
      map.off('zoomend', updateMask);
      map.off('resize', updateMask);
    };
  }, [map, data, opacity, color]);

  return null;
}




