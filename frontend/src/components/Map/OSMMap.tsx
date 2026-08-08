'use client';

import type { InfrastructureObject } from '@/types';
import { MapContainer } from './MapContainer';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/map';

interface OSMMapProps {
  objects: InfrastructureObject[];
  onObjectClick?: (object: InfrastructureObject) => void;
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
}

// Обертка для обратной совместимости
export function OSMMap({
  objects,
  onObjectClick,
  onMapClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}: OSMMapProps) {
  return (
    <MapContainer
      objects={objects}
      onObjectClick={onObjectClick}
      onMapClick={onMapClick}
      center={center}
      zoom={zoom}
    />
  );
}
