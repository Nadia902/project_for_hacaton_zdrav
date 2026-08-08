'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ObjectType } from '@/types';

interface DashboardFiltersProps {
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedType: ObjectType | 'all';
  selectedMunicipality: string;
  onYearChange: (year: number | null) => void;
  onMonthChange: (month: number | null) => void;
  onTypeChange: (type: ObjectType | 'all') => void;
  onMunicipalityChange: (municipality: string) => void;
  availableMunicipalities: Array<{ id: string; name: string; uniqueKey?: string }>;
}

const OBJECT_TYPES: Array<{ value: ObjectType | 'all'; label: string }> = [
  { value: 'all', label: 'Все типы' },
  { value: 'healthy_food', label: 'Здоровое питание' },
  { value: 'alcohol_tobacco', label: 'Алкоголь и табак' },
  { value: 'health_facilities', label: 'Объекты здоровья' },
  { value: 'industrial', label: 'Промышленные' },
  { value: 'waste_collection', label: 'Сбор мусора' },
  { value: 'education', label: 'Образование' },
  { value: 'medical', label: 'Медицина' },
];

const MONTHS = [
  { value: null, label: 'Все месяцы' },
  { value: 1, label: 'Январь' },
  { value: 2, label: 'Февраль' },
  { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' },
  { value: 5, label: 'Май' },
  { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' },
  { value: 8, label: 'Август' },
  { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' },
  { value: 11, label: 'Ноябрь' },
  { value: 12, label: 'Декабрь' },
];

export function DashboardFilters({
  selectedYear,
  selectedMonth,
  selectedType,
  selectedMunicipality,
  onYearChange,
  onMonthChange,
  onTypeChange,
  onMunicipalityChange,
  availableMunicipalities,
}: DashboardFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Фильтры данных
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Фильтр по году */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Год</label>
          <select
            value={selectedYear || ''}
            onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow"
          >
            <option value="">Все годы</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по месяцу */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Месяц</label>
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => onMonthChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow"
          >
            {MONTHS.map((month) => (
              <option key={month.value ?? 'all'} value={month.value ?? ''}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по типу объекта */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Тип объекта</label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as ObjectType | 'all')}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow"
          >
            {OBJECT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по муниципалитету */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Муниципалитет</label>
          <select
            value={selectedMunicipality}
            onChange={(e) => onMunicipalityChange(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow"
          >
            <option value="all">Все МО</option>
            {availableMunicipalities.map((municipality, index) => (
              <option key={municipality.uniqueKey || `${municipality.id}_${index}`} value={municipality.id}>
                {municipality.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

