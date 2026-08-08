'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJSON } from 'geojson';

interface GeoJSONLayerProps {
  data: GeoJSON;
  style?: (feature?: any) => L.PathOptions;
  onEachFeature?: (feature: any, layer: L.Layer) => void;
}

export function GeoJSONLayer({ data, style, onEachFeature }: GeoJSONLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!map) return;

    // Создаем стиль по умолчанию для полигонов муниципальных образований
    const defaultStyle = (feature?: any): L.PathOptions => {
      return {
        color: '#000000', // Черные границы
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
      };
    };

    // Обработчик для каждого feature (полигона)
    const defaultOnEachFeature = (feature: any, layer: L.Layer) => {
      // Делаем полигоны неинтерактивными
      if (layer instanceof L.Path) {
        layer.setStyle({ interactive: false });
      }
    };

    // Создаем GeoJSON слой
    const geoJsonLayer = L.geoJSON(data, {
      style: (feature) => {
        const featureStyle = style ? style(feature) : defaultStyle(feature);
        return {
          ...featureStyle,
          interactive: false, // Делаем неинтерактивными
        };
      },
      onEachFeature: onEachFeature || defaultOnEachFeature,
    });

    // Добавляем слой на карту
    geoJsonLayer.addTo(map);
    layerRef.current = geoJsonLayer;

    // Устанавливаем низкий z-index для слоя полигонов
    // Полигоны должны быть под всеми остальными элементами
    geoJsonLayer.eachLayer((layer) => {
      if (layer instanceof L.Path) {
        const pathElement = layer.getElement();
        if (pathElement && 'style' in pathElement) {
          (pathElement as HTMLElement | SVGElement).style.zIndex = '-1';
          (pathElement as HTMLElement | SVGElement).style.pointerEvents = 'none'; // Отключаем взаимодействие
        }
      }
    });

    // Очистка при размонтировании
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, data, style, onEachFeature]);

  return null;
}

