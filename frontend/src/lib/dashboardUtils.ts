import type { InfrastructureObject, ObjectType } from '@/types';
import type { GeoJSON } from 'geojson';
import { isPointInPolygon } from './municipalityHealth';

/**
 * Определяет муниципалитет для объекта по его координатам
 */
export function getMunicipalityForObject(
  object: InfrastructureObject,
  municipalitiesGeoJSON: GeoJSON
): string | null {
  if (municipalitiesGeoJSON.type !== 'FeatureCollection') {
    return null;
  }

  const point: [number, number] = [object.location.lng, object.location.lat];

  for (const feature of municipalitiesGeoJSON.features) {
    if (feature.geometry.type === 'Polygon') {
      const polygon = (feature.geometry as GeoJSON.Polygon).coordinates;
      if (isPointInPolygon(point, polygon)) {
        return feature.properties?.id || feature.properties?.name || null;
      }
    }
  }

  return null;
}

/**
 * Фильтрует объекты по дате (год и месяц) - мультиселект
 */
export function filterByDate(
  objects: InfrastructureObject[],
  years: Set<number> | number | null,
  months: Set<number> | number | null
): InfrastructureObject[] {
  // Поддержка старого формата (для обратной совместимости)
  let yearsSet: Set<number> | null = null;
  let monthsSet: Set<number> | null = null;

  if (years instanceof Set) {
    yearsSet = years.size > 0 ? years : null;
  } else if (years !== null) {
    yearsSet = new Set([years]);
  }

  if (months instanceof Set) {
    monthsSet = months.size > 0 ? months : null;
  } else if (months !== null) {
    monthsSet = new Set([months]);
  }

  if (!yearsSet && !monthsSet) {
    return objects;
  }

  return objects.filter((obj) => {
    const date = new Date(obj.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (yearsSet && !yearsSet.has(year)) {
      return false;
    }
    
    if (monthsSet && !monthsSet.has(month)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Фильтрует объекты по типу (мультиселект)
 */
export function filterByType(
  objects: InfrastructureObject[],
  types: Set<ObjectType> | string
): InfrastructureObject[] {
  // Поддержка старого формата (для обратной совместимости)
  if (typeof types === 'string') {
    if (types === 'all') {
      return objects;
    }
    return objects.filter((obj) => obj.type === types);
  }
  
  // Новый формат с мультиселектом
  if (types.size === 0) {
    return objects;
  }
  
  return objects.filter((obj) => types.has(obj.type));
}

/**
 * Фильтрует объекты по муниципалитету (мультиселект)
 */
export function filterByMunicipality(
  objects: InfrastructureObject[],
  municipalityIds: Set<string> | string,
  municipalitiesGeoJSON: GeoJSON
): InfrastructureObject[] {
  // Поддержка старого формата (для обратной совместимости)
  if (typeof municipalityIds === 'string') {
    if (municipalityIds === 'all') {
      return objects;
    }

    return objects.filter((obj) => {
      const objMunicipality = getMunicipalityForObject(obj, municipalitiesGeoJSON);
      return objMunicipality === municipalityIds;
    });
  }

  // Новый формат с мультиселектом
  if (municipalityIds.size === 0) {
    return objects;
  }

  return objects.filter((obj) => {
    const objMunicipality = getMunicipalityForObject(obj, municipalitiesGeoJSON);
    return objMunicipality && municipalityIds.has(objMunicipality);
  });
}

