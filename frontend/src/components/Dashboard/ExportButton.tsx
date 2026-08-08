'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { InfrastructureObject } from '@/types';

interface ExportButtonProps {
  data: InfrastructureObject[];
  stats: {
    total: number;
    healthIndex: number;
    ratingsCount: number;
    averageRating: number;
    typeDistribution: Record<string, number>;
    ratingDistribution: {
      high: number;
      medium: number;
      low: number;
      noRating: number;
    };
  };
}

// Функция для преобразования типа объекта в русское название
const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    healthy_food: 'Здоровое питание',
    alcohol_tobacco: 'Алкоголь и табак',
    health_facilities: 'Объекты здоровья',
    industrial: 'Промышленные',
    waste_collection: 'Сбор мусора',
    education: 'Образование',
    medical: 'Медицина',
  };
  return typeMap[type] || type;
};

export function ExportButton({ data, stats }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Заголовки CSV
      const headers = [
        'ID',
        'Название',
        'Тип',
        'Широта',
        'Долгота',
        'Адрес',
        'Средний рейтинг',
        'Количество оценок',
        'Индекс здоровья',
        'Дата создания',
      ];

      // Данные
      const rows = data.map((obj) => [
        obj.id,
        obj.name,
        getTypeLabel(obj.type),
        obj.location.lat.toString(),
        obj.location.lng.toString(),
        obj.location.address || '',
        obj.averageRating?.toString() || '',
        obj.ratingsCount.toString(),
        obj.healthIndex?.toString() || '',
        new Date(obj.createdAt).toLocaleString('ru-RU'),
      ]);

      // Создаем CSV контент
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Создаем BOM для корректного отображения кириллицы в Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Произошла ошибка при экспорте данных');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        summary: {
          totalObjects: stats.total,
          healthIndex: stats.healthIndex,
          totalRatings: stats.ratingsCount,
          averageRating: stats.averageRating,
          typeDistribution: stats.typeDistribution,
          ratingDistribution: stats.ratingDistribution,
        },
        objects: data.map((obj) => ({
          id: obj.id,
          name: obj.name,
          type: obj.type,
          description: obj.description,
          location: obj.location,
          averageRating: obj.averageRating,
          ratingsCount: obj.ratingsCount,
          healthIndex: obj.healthIndex,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
          createdBy: obj.createdBy,
        })),
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Произошла ошибка при экспорте данных');
    } finally {
      setIsExporting(false);
    }
  };

  const exportStatistics = () => {
    setIsExporting(true);
    
    try {
      // Создаем текстовый отчет со статистикой
      const report = [
        'ОТЧЕТ ПО ДАННЫМ ДАШБОРДА',
        `Дата экспорта: ${new Date().toLocaleString('ru-RU')}`,
        '',
        '=== ОБЩАЯ СТАТИСТИКА ===',
        `Всего объектов: ${stats.total}`,
        `Индекс здоровья (ИЗМО): ${stats.healthIndex.toFixed(2)}`,
        `Всего оценок: ${stats.ratingsCount}`,
        `Средний рейтинг: ${stats.averageRating.toFixed(2)}`,
        '',
        '=== РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ===',
        ...Object.entries(stats.typeDistribution)
          .map(([type, count]) => `  ${getTypeLabel(type)}: ${count}`)
          .sort((a, b) => {
            // Сортируем по количеству (убывание), затем по названию
            const countA = parseInt(a.split(': ')[1]);
            const countB = parseInt(b.split(': ')[1]);
            if (countB !== countA) return countB - countA;
            return a.localeCompare(b, 'ru');
          }),
        '',
        '=== РАСПРЕДЕЛЕНИЕ ПО РЕЙТИНГАМ ===',
        `  Высокий (4+): ${stats.ratingDistribution.high}`,
        `  Средний (3-4): ${stats.ratingDistribution.medium}`,
        `  Низкий (<3): ${stats.ratingDistribution.low}`,
        `  Без оценки: ${stats.ratingDistribution.noRating}`,
      ].join('\n');

      const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard_statistics_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Произошла ошибка при экспорте данных');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        disabled={isExporting}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-background border border-border hover:bg-muted rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowDownTrayIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">{isExporting ? 'Экспорт...' : 'Экспорт'}</span>
      </button>

      {/* Выпадающее меню */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-1 w-40 sm:w-48 bg-background border border-border rounded shadow-lg z-50 overflow-hidden"
        >
        <button
          onClick={(e) => {
            e.stopPropagation();
            exportToCSV();
            setIsMenuOpen(false);
          }}
          className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2 text-foreground"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            exportToJSON();
            setIsMenuOpen(false);
          }}
          className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2 text-foreground"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          JSON
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            exportStatistics();
            setIsMenuOpen(false);
          }}
          className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2 text-foreground border-t border-border"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Статистика
        </button>
        </div>
      )}
    </div>
  );
}

