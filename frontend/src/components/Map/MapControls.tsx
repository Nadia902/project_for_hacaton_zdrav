'use client';

import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MapControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onCenterToTula: () => void;
}

export function MapControls({
  zoom,
  onZoomChange,
  onCenterToTula,
}: MapControlsProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-10 flex flex-col gap-3 pointer-events-none`}>
      {/* Кнопка центрирования на Туле */}
      <motion.button
        onClick={onCenterToTula}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`group ${isMobile ? 'px-3 py-2' : 'px-4 py-2.5'} bg-background/90 backdrop-blur-md border border-border/50 rounded-xl text-xs md:text-sm font-semibold hover:bg-accent/80 hover:border-border transition-all duration-200 shadow-lg hover:shadow-xl pointer-events-auto flex items-center gap-2`}
        title="Центрировать на Туле"
      >
        <MapPinIcon className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-primary group-hover:scale-110 transition-transform`} />
        <span className="hidden sm:inline">Тула</span>
      </motion.button>
      
      {/* Контролы зума */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-background/90 backdrop-blur-md border border-border/50 rounded-xl ${isMobile ? 'p-1' : 'p-1.5'} shadow-lg pointer-events-auto overflow-hidden`}
      >
        <motion.button
          onClick={() => onZoomChange(zoom + 1)}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--accent), 0.1)' }}
          whileTap={{ scale: 0.95 }}
          className={`${isMobile ? 'w-9 h-9' : 'w-11 h-11'} flex items-center justify-center hover:bg-accent/50 rounded-lg transition-all duration-200 group`}
          title="Увеличить"
        >
          <MagnifyingGlassPlusIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-foreground/70 group-hover:text-foreground transition-colors`} />
        </motion.button>
        
        <div className={`${isMobile ? 'w-9 h-7' : 'w-11 h-9'} flex items-center justify-center text-xs font-bold text-foreground/80 border-t border-b border-border/50 bg-muted/30`}>
          {Math.round(zoom)}
        </div>
        
        <motion.button
          onClick={() => onZoomChange(zoom - 1)}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--accent), 0.1)' }}
          whileTap={{ scale: 0.95 }}
          className={`${isMobile ? 'w-9 h-9' : 'w-11 h-11'} flex items-center justify-center hover:bg-accent/50 rounded-lg transition-all duration-200 group`}
          title="Уменьшить"
        >
          <MagnifyingGlassMinusIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-foreground/70 group-hover:text-foreground transition-colors`} />
        </motion.button>
      </motion.div>
    </div>
  );
}

