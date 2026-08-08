import type { GeoJSON } from 'geojson';
import type L from 'leaflet';
import municipalitiesData from '@/data/tulaMunicipalities.json';

// Тип для исходных данных
interface MunicipalityData {
  id: string;
  polygon: string; // JSON строка с геометрией
  areaName: string;
  regionName: string;
}

// Преобразуем данные в формат GeoJSON
function transformToGeoJSON(data: MunicipalityData[]): GeoJSON {
  return {
    type: 'FeatureCollection',
    features: data.map((item) => {
      const geometry = JSON.parse(item.polygon);
      return {
        type: 'Feature',
        geometry,
        properties: {
          id: item.id,
          name: item.areaName,
          region: item.regionName,
          type: item.areaName.includes('городской округ') ? 'городской округ' : 'муниципальный район',
        },
      };
    }),
  };
}

// Экспортируем GeoJSON данные для муниципальных образований
export const TULA_MUNICIPALITIES_GEOJSON: GeoJSON = transformToGeoJSON(municipalitiesData as MunicipalityData[]);

// Функция для получения стиля полигона по типу муниципального образования
export function getMunicipalityStyle(feature?: any): L.PathOptions {
  const isCity = feature?.properties?.type === 'городской округ';
  
  return {
    color: '#000000', // Черные границы
    fillColor: isCity ? '#60a5fa' : '#93c5fd',
    fillOpacity: 0, // Убрана заливка
    weight: isCity ? 1.5 : 1, // Уменьшена толщина
    opacity: 0.7,
    dashArray: isCity ? '8, 4' : '5, 5',
    interactive: false, // Полигоны неинтерактивны
  };
}

