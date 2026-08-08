import type { InfrastructureObject, HeatmapData } from '@/types';
import { TULA_REGION_BOUNDARIES } from './tulaRegionBoundaries';
import { GiHealthNormal } from 'react-icons/gi';
import { FaRegHospital } from 'react-icons/fa';
import { PiTree } from 'react-icons/pi';
import { 
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import { IoSchoolOutline, IoFitnessOutline } from 'react-icons/io5';
import { FaIndustry } from 'react-icons/fa';
import { MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import type { ComponentType, SVGProps } from 'react';
import React from 'react';
import { renderToString } from 'react-dom/server';

export const DEFAULT_CENTER: [number, number] = [53.935683, 37.5690433];
export const DEFAULT_ZOOM = 8;
export const DEFAULT_ZOOM_MOBILE = 6;

export const TULA_REGION_BOUNDS = {
  north: 56.0,
  south: 51.5,
  east: 40.0,
  west: 35.0,
};

export const TULA_REGION_POLYGON: [number, number][] = TULA_REGION_BOUNDARIES;

export const MIN_ZOOM = 7;
export const MIN_ZOOM_MOBILE = 1;
export const MAX_ZOOM = 15;

export function getMarkerColor(rating?: number): string {
  if (!rating) return '#94a3b8';
  
  if (rating >= 4.5) return '#22c55e';
  if (rating >= 4.0) return '#84cc16';
  if (rating >= 3.5) return '#eab308';
  if (rating >= 3.0) return '#f97316';
  return '#ef4444';
}

const iconSvgCache = new Map<string, string>();

export function clearIconCache(): void {
  iconSvgCache.clear();
}

export async function preloadIcons(): Promise<void> {
  if (typeof window === 'undefined') return;

  const iconTypes = ['healthy_food', 'alcohol_tobacco', 'health_facilities', 'industrial', 'waste_collection', 'education', 'medical'];
  const sizes = [14, 16, 24];

  for (const type of iconTypes) {
    for (const size of sizes) {
      const IconComponent = getMarkerIconComponent(type);
      const cacheKey = `${IconComponent.name || 'icon'}_${size}`;
      
      if (iconSvgCache.has(cacheKey)) continue;

      try {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);

        const ReactDOM = require('react-dom/client');
        const root = ReactDOM.createRoot(tempDiv);
        
        root.render(React.createElement(IconComponent, { 
          style: { width: `${size}px`, height: `${size}px` },
          color: 'currentColor'
        }));

        await new Promise<void>((resolve) => {
          const checkSvg = () => {
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              let svgString = svgElement.outerHTML;
              svgString = svgString.replace(
                /width="[^"]*"/,
                `width="${size}"`
              ).replace(
                /height="[^"]*"/,
                `height="${size}"`
              );
              iconSvgCache.set(cacheKey, svgString);
              root.unmount();
              document.body.removeChild(tempDiv);
              resolve();
            } else {
              setTimeout(checkSvg, 10);
            }
          };
          checkSvg();
        });
      } catch (error) {
      }
    }
  }
}

function iconComponentToSvg(IconComponent: ComponentType<SVGProps<SVGSVGElement>>, size: number = 24): string {
  const cacheKey = `${IconComponent.name || 'icon'}_${size}`;
  if (iconSvgCache.has(cacheKey)) {
    return iconSvgCache.get(cacheKey)!;
  }

  try {
    const svgString = renderToString(React.createElement(IconComponent, { 
      style: { width: `${size}px`, height: `${size}px` },
      color: 'currentColor'
    }));
    
    const updatedSvg = svgString.replace(
      /width="[^"]*"/,
      `width="${size}"`
    ).replace(
      /height="[^"]*"/,
      `height="${size}"`
    );
    
    iconSvgCache.set(cacheKey, updatedSvg);
    return updatedSvg;
  } catch (error) {
    const svgString = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>`;
    iconSvgCache.set(cacheKey, svgString);
    return svgString;
  }
}

export function getMarkerIconSvg(type: string): string {
  const IconComponent = getMarkerIconComponent(type);
  const svgString = iconComponentToSvg(IconComponent, 24);
  
  const match = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (match && match[1]) {
    return match[1];
  }
  
  return '<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />';
}

// Получение полного SVG для иконки
export function getMarkerIconSvgFull(type: string, size: number = 14): string {
  const IconComponent = getMarkerIconComponent(type);
  const svgString = iconComponentToSvg(IconComponent, size);
  
  if (!svgString || !svgString.includes('<svg')) {
    // Fallback - используем простой SVG с кругом
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8"/></svg>`;
  }
  
  // Убеждаемся, что SVG имеет правильные атрибуты
  let updatedSvg = svgString;
  
  // Обновляем размеры
  updatedSvg = updatedSvg.replace(
    /width="[^"]*"/,
    `width="${size}"`
  ).replace(
    /height="[^"]*"/,
    `height="${size}"`
  );
  
  // Для stroke иконок используем fill="none", для fill иконок - fill="currentColor"
  if (updatedSvg.includes('stroke=') && !updatedSvg.includes('fill=')) {
    updatedSvg = updatedSvg.replace(/<svg([^>]*)>/i, '<svg$1 fill="none">');
  } else if (!updatedSvg.includes('fill=')) {
    updatedSvg = updatedSvg.replace('<svg', '<svg fill="currentColor"');
  } else {
    // Заменяем fill на currentColor если он другой (но не для stroke иконок)
    if (!updatedSvg.includes('stroke=')) {
      updatedSvg = updatedSvg.replace(/fill="[^"]*"/g, 'fill="currentColor"');
    }
  }
  
  // Убеждаемся, что есть viewBox
  if (!updatedSvg.includes('viewBox=')) {
    updatedSvg = updatedSvg.replace('<svg', '<svg viewBox="0 0 24 24"');
  }
  
  // Убеждаемся, что stroke="currentColor" для stroke иконок
  if (updatedSvg.includes('stroke=') && !updatedSvg.includes('stroke="currentColor"')) {
    updatedSvg = updatedSvg.replace(/stroke="[^"]*"/g, 'stroke="currentColor"');
  }
  
  return updatedSvg;
}

// Получение React компонента иконки по типу объекта
export function getMarkerIconComponent(type: string): ComponentType<SVGProps<SVGSVGElement>> {
  const iconComponents: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    healthy_food: GiHealthNormal,              // Точки здорового питания
    alcohol_tobacco: ExclamationTriangleIcon,  // Точки продажи алкоголя и табака
    health_facilities: IoFitnessOutline,   // Объекты для поддержания здоровья
    industrial: FaIndustry,                 // Промышленные объекты
    waste_collection: ExclamationTriangleIcon,  // Точки сбора мусора
    education: IoSchoolOutline,           // Образовательные учреждения
    medical: FaRegHospital,                    // Медицинские организации
  };
  
  return iconComponents[type] || MapPinIcon;
}

// Обратная совместимость: возвращает пустую строку (для компонентов, которые используют React иконки напрямую)
export function getMarkerIcon(type: string): string {
  // Возвращаем пустую строку, так как теперь используем SVG иконки
  // Компоненты должны использовать React иконки напрямую через getMarkerIconComponent
  return '';
}

// Создание popup контента для маркера
export function createMarkerPopup(object: InfrastructureObject): string {
  const rating = object.averageRating
    ? `⭐ ${object.averageRating.toFixed(1)}`
    : 'Нет оценок';
  const ratingsCount = object.ratingsCount > 0 ? `(${object.ratingsCount})` : '';
  
  return `
    <div style="padding: 8px; min-width: 200px;">
      <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 16px;">
        ${object.name}
      </h3>
      <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">
        ${object.location.address || 'Адрес не указан'}
      </p>
      <p style="margin: 0; font-size: 14px;">
        ${rating} ${ratingsCount}
      </p>
    </div>
  `;
}

// Преобразование объектов в данные для тепловой карты
export function objectsToHeatmapData(
  objects: InfrastructureObject[]
): HeatmapData[] {
  return objects
    .filter(obj => obj.healthIndex !== undefined)
    .map(obj => ({
      lat: obj.location.lat,
      lng: obj.location.lng,
      value: obj.healthIndex || 0,
    }));
}

// Вычисление границ карты из объектов
export function calculateBounds(objects: InfrastructureObject[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (objects.length === 0) return null;

  let north = objects[0].location.lat;
  let south = objects[0].location.lat;
  let east = objects[0].location.lng;
  let west = objects[0].location.lng;

  objects.forEach(obj => {
    const { lat, lng } = obj.location;
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });

  return { north, south, east, west };
}



