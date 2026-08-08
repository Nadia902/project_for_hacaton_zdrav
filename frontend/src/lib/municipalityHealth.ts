import type { InfrastructureObject } from '@/types';
import type { GeoJSON } from 'geojson';

// Функция для проверки, находится ли точка внутри полигона (Point-in-Polygon)
// Использует алгоритм Ray Casting
export function isPointInPolygon(
  point: [number, number], // [lng, lat]
  polygon: number[][][] // GeoJSON coordinates: [[[lng, lat], ...]]
): boolean {
  const [lng, lat] = point;
  let inside = false;

  // Проверяем только внешний контур (первый ring)
  // Остальные rings - это дыры, которые мы пока игнорируем
  const outerRing = polygon[0];
  
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const [xi, yi] = outerRing[i]; // [lng, lat]
    const [xj, yj] = outerRing[j]; // [lng, lat]
    
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    
    if (intersect) inside = !inside;
  }

  return inside;
}

// Вычисление центра полигона (центроид)
// Возвращает [lat, lng] для Leaflet
export function getPolygonCenter(coordinates: number[][][]): [number, number] {
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  // Используем только внешний контур для расчета центра
  const outerRing = coordinates[0];
  
  for (const [lng, lat] of outerRing) {
    sumLat += lat;
    sumLng += lng;
    count++;
  }

  // Возвращаем [lat, lng] для Leaflet
  return [sumLat / count, sumLng / count];
}

// Вычисление ИЗМО для муниципального образования
// Использует healthIndex если есть, иначе преобразует averageRating в healthIndex (0-100)
export function calculateMunicipalityHealthIndex(
  municipalityFeature: GeoJSON.Feature,
  objects: InfrastructureObject[]
): number {
  if (!municipalityFeature.geometry || municipalityFeature.geometry.type !== 'Polygon') {
    return 0;
  }

  const polygon = (municipalityFeature.geometry as GeoJSON.Polygon).coordinates;
  
  // Фильтруем объекты, которые находятся внутри полигона
  const objectsInMunicipality = objects.filter((obj) => {
    const point: [number, number] = [obj.location.lng, obj.location.lat];
    return isPointInPolygon(point, polygon);
  });

  if (objectsInMunicipality.length === 0) return 0;

  // Вычисляем средний индекс здоровья объектов в МО
  // Используем healthIndex если есть, иначе преобразуем averageRating (0-5) в healthIndex (0-100)
  const healthValues = objectsInMunicipality
    .map((obj) => {
      if (obj.healthIndex !== undefined) {
        return obj.healthIndex;
      }
      // Преобразуем averageRating (0-5) в healthIndex (0-100)
      if (obj.averageRating !== undefined) {
        return (obj.averageRating / 5) * 100;
      }
      return null;
    })
    .filter((val): val is number => val !== null);

  if (healthValues.length === 0) return 0;

  const sum = healthValues.reduce((acc, val) => acc + val, 0);
  return sum / healthValues.length;
}

// Получение цвета по значению ИЗМО
export function getHealthIndexColor(healthIndex: number): string {
  if (healthIndex >= 80) return '#22c55e'; // green-500
  if (healthIndex >= 60) return '#84cc16'; // lime-500
  if (healthIndex >= 40) return '#eab308'; // yellow-500
  if (healthIndex >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

