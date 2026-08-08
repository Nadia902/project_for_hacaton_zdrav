'use client';

import { useState, useEffect } from 'react';

/**
 * Хук для определения мобильного устройства
 * @returns true если устройство мобильное (ширина экрана < 768px)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Проверяем при монтировании
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Проверяем сразу
    checkIsMobile();

    // Слушаем изменения размера окна
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}

