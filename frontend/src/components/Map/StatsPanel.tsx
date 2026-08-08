'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { InfrastructureObject } from '@/types';
import { getHealthIndexColor } from '@/lib/utils';

interface StatsPanelProps {
  municipality: string;
  municipalityLabel: string;
  objects: InfrastructureObject[];
  healthIndex?: number; // ИЗМО (0-100)
  ratingsCount?: number;
  onShowRecommendations?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function StatsPanel({
  municipality,
  municipalityLabel,
  objects,
  healthIndex = 0,
  ratingsCount = 0,
  onShowRecommendations,
  isOpen = true,
  onToggle,
}: StatsPanelProps) {
  // Распределение объектов по рейтингам
  const ratingDistribution = useMemo(() => {
    const distribution = {
      high: 0, // 4+
      medium: 0, // 3-4
      low: 0, // <3
      noRating: 0,
    };

    objects.forEach((obj) => {
      const rating = obj.averageRating;
      if (!rating) {
        distribution.noRating++;
      } else if (rating >= 4) {
        distribution.high++;
      } else if (rating >= 3) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    });

    return distribution;
  }, [objects]);

  // Распределение по типам объектов
  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    objects.forEach((obj) => {
      distribution[obj.type] = (distribution[obj.type] || 0) + 1;
    });
    return distribution;
  }, [objects]);

  const healthIndexColor = getHealthIndexColor(healthIndex);
  const healthIndexPercentage = Math.round(healthIndex);

  return (
    <div className={cn(
      "absolute top-12 left-4 z-30 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl transition-all duration-300 flex flex-col max-h-[calc(100vh-2rem)]",
      isOpen ? "w-[calc(100vw-2rem)] sm:w-80 max-w-sm" : "w-10 sm:w-12"
    )}>
      {/* Заголовок */}
      <div className={cn(
        "border-b border-border flex items-center transition-all duration-300 flex-shrink-0",
        isOpen ? "p-3 md:p-4 justify-between" : "p-2 justify-center"
      )}>
        {isOpen && <h3 className="font-semibold text-base sm:text-lg">Статистика</h3>}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
          >
            <svg
              className="w-5 h-5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
              />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-200px)]">
          {/* Текущий муниципалитет */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Муниципалитет
            </h4>
            <p className="text-base sm:text-lg font-semibold">{municipalityLabel}</p>
          </div>

          {/* ИЗМО */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase flex-shrink-0">
                <span className="hidden sm:inline">Индекс здоровья МО (ИЗМО)</span>
                <span className="sm:hidden">ИЗМО</span>
              </h4>
              <span className="text-base sm:text-lg font-bold flex-shrink-0" style={{ color: healthIndexColor }}>
                {healthIndex.toFixed(2)}/100
              </span>
            </div>
            
            {/* Прогресс-бар */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${healthIndexPercentage}%`,
                  backgroundColor: healthIndexColor,
                }}
              />
            </div>
            
            {/* Радиальная визуализация (упрощенная) */}
            <div className="mt-3 md:mt-4 flex items-center justify-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    stroke={healthIndexColor}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(healthIndexPercentage / 100) * 251.2} 251.2`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base sm:text-xl font-bold" style={{ color: healthIndexColor }}>
                    {healthIndexPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Количество оценок */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Количество оценок
            </h4>
            <p className="text-xl sm:text-2xl font-bold">{ratingsCount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              за текущий период
            </p>
          </div>

          {/* Распределение объектов по рейтингам */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              Распределение по рейтингам
            </h4>
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm flex-shrink-0">Высокий (4+)</span>
                <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[60px]">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${
                          objects.length > 0
                            ? (ratingDistribution.high / objects.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold w-6 sm:w-8 text-right flex-shrink-0">
                    {ratingDistribution.high}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm flex-shrink-0">Средний (3-4)</span>
                <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[60px]">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-300"
                      style={{
                        width: `${
                          objects.length > 0
                            ? (ratingDistribution.medium / objects.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold w-6 sm:w-8 text-right flex-shrink-0">
                    {ratingDistribution.medium}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm flex-shrink-0">Низкий (&lt;3)</span>
                <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[60px]">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{
                        width: `${
                          objects.length > 0
                            ? (ratingDistribution.low / objects.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold w-6 sm:w-8 text-right flex-shrink-0">
                    {ratingDistribution.low}
                  </span>
                </div>
              </div>
              {ratingDistribution.noRating > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">Без оценки</span>
                  <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[60px]">
                      <div
                        className="h-full bg-gray-400 transition-all duration-300"
                        style={{
                          width: `${
                            objects.length > 0
                              ? (ratingDistribution.noRating / objects.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold w-6 sm:w-8 text-right text-muted-foreground flex-shrink-0">
                      {ratingDistribution.noRating}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Распределение по типам объектов */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              По типам объектов
            </h4>
            <div className="space-y-1.5 md:space-y-2">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm capitalize">{type}</span>
                  <span className="text-xs sm:text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопка рекомендаций */}
          {onShowRecommendations && (
            <button
              onClick={onShowRecommendations}
              className="w-full px-4 py-2.5 md:py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary active:bg-primary/80 text-sm sm:text-base"
            >
              Показать рекомендации
            </button>
          )}
        </div>
      )}
    </div>
  );
}

