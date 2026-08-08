'use client';

import { useIsMobile } from '@/hooks/useIsMobile';

export type MapLayer = 'objects' | 'izmo';

interface LayerSwitcherProps {
  currentLayer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
}

export function LayerSwitcher({ currentLayer, onLayerChange }: LayerSwitcherProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={`absolute ${isMobile ? 'bottom-2 left-2' : 'bottom-4 left-4'} z-[1000] bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border ${isMobile ? 'p-0.5' : 'p-1'}`}>
      <div className="flex gap-1">
        <button
          onClick={() => onLayerChange('izmo')}
          className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium rounded-md transition-all ${
            currentLayer === 'izmo'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          ИЗМО
        </button>
        <button
          onClick={() => onLayerChange('objects')}
          className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium rounded-md transition-all ${
            currentLayer === 'objects'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Объекты
        </button>
      </div>
    </div>
  );
}

