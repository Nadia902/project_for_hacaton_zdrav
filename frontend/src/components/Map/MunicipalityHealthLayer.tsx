'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJSON } from 'geojson';
import type { InfrastructureObject } from '@/types';
import {
  getPolygonCenter,
  getHealthIndexColor,
} from '@/lib/municipalityHealth';
import { useMunicipalityHealthIndex } from '@/hooks/useMunicipalityHealthIndex';

interface MunicipalityHealthLayerProps {
  data: GeoJSON;
  objects: InfrastructureObject[];
  style?: (feature?: any, healthIndex?: number) => L.PathOptions;
  onMunicipalityClick?: (municipalityName: string, healthIndex: number | null) => void;
}

export function MunicipalityHealthLayer({
  data,
  objects,
  style,
  onMunicipalityClick,
}: MunicipalityHealthLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const labelsRef = useRef<L.LayerGroup | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const { getHealthIndex, getMunicipalityData, isLoading: isLoadingHealthIndex } = useMunicipalityHealthIndex();

  useEffect(() => {
    if (!map) return;

    const defaultStyle = (feature?: any, healthIndex?: number): L.PathOptions => {
      const fillColor = healthIndex !== undefined 
        ? getHealthIndexColor(healthIndex)
        : '#3b82f6';
      
      return {
        color: '#000000',
        fillColor: fillColor,
        fillOpacity: 0.3,
        weight: 1,
        opacity: 0.7,
        dashArray: '5, 5',
        interactive: true,
      };
    };

    const geoJsonLayer = L.geoJSON(data, {
      style: (feature) => {
        if (!feature) {
          return defaultStyle(undefined, undefined);
        }
        const municipalityName = feature.properties?.name;
        const healthIndex = municipalityName ? getHealthIndex(municipalityName) : null;
        return (style ? style(feature, healthIndex ?? undefined) : defaultStyle(feature, healthIndex ?? undefined));
      },
      onEachFeature: (feature, layer) => {
        if (layer instanceof L.Path) {
          layer.setStyle({ interactive: true });
          const pathElement = layer.getElement();
          if (pathElement && 'style' in pathElement) {
            (pathElement as HTMLElement | SVGElement).style.zIndex = '1';
            (pathElement as HTMLElement | SVGElement).style.pointerEvents = 'auto';
            (pathElement as HTMLElement | SVGElement).style.cursor = 'pointer';
          }

          layer.on('click', (e) => {
            const municipalityName = feature.properties?.name || 'Неизвестное МО';
            const healthIndex = municipalityName ? getHealthIndex(municipalityName) : null;
            const municipalityData = getMunicipalityData(municipalityName);
            
            const displayName = municipalityData?.mo || municipalityName;
            
            const color = healthIndex !== null ? getHealthIndexColor(healthIndex) : '#3b82f6';
            
            const popupContent = `
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #1f2937;">
                  ${displayName}
                </h3>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
                  <span style="font-size: 14px; color: #6b7280;">ИЗМО:</span>
                  <span style="font-size: 18px; font-weight: 700; color: ${color};">
                    ${healthIndex !== null ? healthIndex.toFixed(2) : 'Н/Д'}
                  </span>
                </div>
                ${municipalityData ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                      Оценок: ${municipalityData.total_ratings}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                      Население: ${municipalityData.population.toLocaleString()}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                      Оценок на 1000: ${municipalityData.ratings_per_1000.toFixed(2)}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;

            if (popupRef.current) {
              map.closePopup(popupRef.current);
            }

            const popup = L.popup({
              className: 'municipality-popup',
              maxWidth: 300,
            })
              .setLatLng(e.latlng)
              .setContent(popupContent)
              .openOn(map);

            popupRef.current = popup;

            if (onMunicipalityClick) {
              onMunicipalityClick(municipalityName, healthIndex);
            }
          });

          layer.on('mouseover', () => {
            if (layer instanceof L.Path) {
              layer.setStyle({ weight: 2, opacity: 1 });
            }
          });

          layer.on('mouseout', () => {
            if (layer instanceof L.Path) {
              const municipalityName = feature.properties?.name;
              const healthIndex = municipalityName ? getHealthIndex(municipalityName) : null;
              const fillColor = healthIndex !== null 
                ? getHealthIndexColor(healthIndex)
                : '#3b82f6';
              layer.setStyle({ 
                weight: 1, 
                opacity: 0.7,
                fillColor: fillColor,
              });
            }
          });
        }
      },
    });

    const labelsLayer = L.layerGroup();

    if (data.type === 'FeatureCollection') {
      data.features.forEach((feature) => {
        if (feature.geometry.type === 'Polygon') {
          const municipalityName = feature.properties?.name;
          const healthIndex = municipalityName ? getHealthIndex(municipalityName) : null;
          const municipalityData = municipalityName ? getMunicipalityData(municipalityName) : null;
          
          const displayName = municipalityData?.mo || municipalityName || 'МО';
          
          if (healthIndex !== null && healthIndex > 0) {
            const center = getPolygonCenter(
              (feature.geometry as GeoJSON.Polygon).coordinates
            );
            const color = getHealthIndexColor(healthIndex);

            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
              position: absolute;
              visibility: hidden;
              padding: 6px 10px;
              font-weight: 600;
              font-size: 10px;
              white-space: nowrap;
              font-family: system-ui, -apple-system, sans-serif;
            `;
            tempDiv.textContent = displayName;
            document.body.appendChild(tempDiv);
            const nameWidth = Math.max(tempDiv.offsetWidth, 80);
            document.body.removeChild(tempDiv);

            const fullTempDiv = document.createElement('div');
            fullTempDiv.style.cssText = `
              position: absolute;
              visibility: hidden;
              padding: 6px 10px;
              font-weight: 600;
              text-align: center;
              font-family: system-ui, -apple-system, sans-serif;
            `;
            fullTempDiv.innerHTML = `
              <div style="font-size: 10px; line-height: 1.2; margin-bottom: 2px;">${displayName}</div>
              <div style="font-size: 14px; font-weight: 700; line-height: 1.2;">${healthIndex.toFixed(1)}</div>
            `;
            document.body.appendChild(fullTempDiv);
            const fullHeight = fullTempDiv.offsetHeight;
            const fullWidth = Math.max(fullTempDiv.offsetWidth, nameWidth + 20);
            document.body.removeChild(fullTempDiv);

            const label = L.marker([center[0], center[1]], {
              icon: L.divIcon({
                className: 'municipality-health-label',
                html: `
                  <div style="
                    background: rgba(255, 255, 255, 0.95);
                    border: 2px solid ${color};
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    pointer-events: none;
                    text-align: center;
                    width: ${fullWidth}px;
                    box-sizing: border-box;
                  ">
                    <div style="
                      font-size: 10px;
                      color: #666;
                      margin-bottom: 2px;
                      line-height: 1.2;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    ">
                      ${displayName}
                    </div>
                    <div style="
                      font-size: 14px;
                      color: ${color};
                      font-weight: 700;
                      line-height: 1.2;
                    ">
                      ${healthIndex.toFixed(1)}
                    </div>
                  </div>
                `,
                iconSize: [fullWidth, fullHeight],
                iconAnchor: [fullWidth / 2, fullHeight / 2],
              }),
              interactive: false,
              zIndexOffset: 100, // Выше полигонов, но ниже маркеров объектов
            });

            labelsLayer.addLayer(label);
          }
        }
      });
    }

    geoJsonLayer.addTo(map);
    labelsLayer.addTo(map);
    
    layerRef.current = geoJsonLayer;
    labelsRef.current = labelsLayer;

    return () => {
      if (popupRef.current) {
        map.closePopup(popupRef.current);
        popupRef.current = null;
      }
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (labelsRef.current) {
        map.removeLayer(labelsRef.current);
        labelsRef.current = null;
      }
    };
  }, [map, data, objects, style, getHealthIndex, getMunicipalityData, onMunicipalityClick]);

  return null;
}

