'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { MedicineCapsule } from './MedicineCapsule';

interface CapsuleSceneProps {
  className?: string;
}

// Error Boundary компонент
function ErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Ошибка загрузки 3D модели</p>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
        >
          Перезагрузить
        </button>
      </div>
    </div>
  );
}

export function CapsuleScene({ className = '' }: CapsuleSceneProps) {
  const [key, setKey] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Обработка изменения размера окна
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce для оптимизации
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        try {
          setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
          });
          // Перезагружаем Canvas при изменении размера
          setKey(prev => prev + 1);
          setError(null);
        } catch (err) {
          // Resize handler error
        }
      }, 150);
    };

    // Отслеживание изменения размера
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Инициализация размеров
    try {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    } catch (err) {
      // Initial dimensions error
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleReset = useCallback(() => {
    setError(null);
    setKey(prev => prev + 1);
  }, []);

  // Обработка ошибок рендеринга
  const handleError = useCallback((error: Error) => {
    setError(error);
  }, []);

  if (error) {
    return <ErrorFallback onReset={handleReset} />;
  }

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '160px', position: 'relative' }}>
      <Canvas
        key={key}
        camera={{ position: [0, 0, 3], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]}
        shadows={false}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={(state) => {
          try {
            // Убеждаемся, что камера правильно настроена
            if (state.camera) {
              state.camera.lookAt(0, 0, 0);
            }
            // Обновляем размеры при создании
            if (state.gl && state.size) {
              state.gl.setSize(state.size.width, state.size.height);
            }
          } catch (err) {
            // Обрабатываем ошибку
            if (err instanceof Error) {
              handleError(err);
            }
          }
        }}
      >
        <Suspense 
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div>
          }
        >
          {/* Мягкие тени под капсулой */}
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.2}
            scale={2}
            blur={2}
            far={1.2}
          />
          
          {/* Капсула */}
          <MedicineCapsule />
        </Suspense>
      </Canvas>
    </div>
  );
}

