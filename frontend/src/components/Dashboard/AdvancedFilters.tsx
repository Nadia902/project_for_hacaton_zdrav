'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { ObjectType, InfrastructureObject } from '@/types';
import type { GeoJSON } from 'geojson';
import { getMunicipalityForObject } from '@/lib/dashboardUtils';
import { useIsMobile } from '@/hooks/useIsMobile';

const OBJECT_TYPE_LABELS: Record<ObjectType | 'all', string> = {
  all: 'Все типы',
  healthy_food: 'Здоровое питание',
  alcohol_tobacco: 'Алкоголь и табак',
  health_facilities: 'Объекты здоровья',
  industrial: 'Промышленные',
  waste_collection: 'Сбор мусора',
  education: 'Образование',
  medical: 'Медицина',
};

interface AdvancedFiltersProps {
  allObjects: InfrastructureObject[];
  selectedYears: Set<number>;
  selectedMonths: Set<number>;
  selectedTypes: Set<ObjectType>;
  selectedMunicipalities: Set<string>;
  municipalitiesGeoJSON: GeoJSON;
  onYearsChange: (years: Set<number>) => void;
  onMonthsChange: (months: Set<number>) => void;
  onTypesChange: (types: Set<ObjectType>) => void;
  onMunicipalitiesChange: (municipalities: Set<string>) => void;
  onReset: () => void;
  isAccordionOpen?: boolean;
  onAccordionToggle?: () => void;
}

export function AdvancedFilters({
  allObjects,
  selectedYears,
  selectedMonths,
  selectedTypes,
  selectedMunicipalities,
  municipalitiesGeoJSON,
  onYearsChange,
  onMonthsChange,
  onTypesChange,
  onMunicipalitiesChange,
  onReset,
  isAccordionOpen: externalIsAccordionOpen,
  onAccordionToggle: externalOnAccordionToggle,
}: AdvancedFiltersProps) {
  const isMobile = useIsMobile();
  const [internalIsAccordionOpen, setInternalIsAccordionOpen] = useState(true);
  
  const isAccordionOpen = externalIsAccordionOpen !== undefined ? externalIsAccordionOpen : internalIsAccordionOpen;
  const setIsAccordionOpen = externalOnAccordionToggle || (() => setInternalIsAccordionOpen(!internalIsAccordionOpen));
  
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const municipalityDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [typeDropdownRef, municipalityDropdownRef, yearDropdownRef, monthDropdownRef];
      const isOutside = refs.every(ref => 
        ref.current && !ref.current.contains(event.target as Node)
      );
      if (isOutside) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableOptions = useMemo(() => {
    const getAvailableForFilter = (excludeFilter: 'types' | 'municipalities' | 'years' | 'months') => {
      let filtered = allObjects;

      if (excludeFilter !== 'types' && selectedTypes.size > 0) {
        filtered = filtered.filter(obj => selectedTypes.has(obj.type));
      }

      if (excludeFilter !== 'municipalities' && selectedMunicipalities.size > 0) {
        filtered = filtered.filter(obj => {
          const objMunicipality = getMunicipalityForObject(obj, municipalitiesGeoJSON);
          return objMunicipality && selectedMunicipalities.has(objMunicipality);
        });
      }

      if (excludeFilter !== 'years' && selectedYears.size > 0) {
        filtered = filtered.filter(obj => {
          const year = new Date(obj.createdAt).getFullYear();
          return selectedYears.has(year);
        });
      }

      if (excludeFilter !== 'months' && selectedMonths.size > 0) {
        filtered = filtered.filter(obj => {
          const month = new Date(obj.createdAt).getMonth() + 1;
          return selectedMonths.has(month);
        });
      }

      return filtered;
    };

    const typesForTypes = getAvailableForFilter('types');
    const availableTypes = new Set<ObjectType>();
    typesForTypes.forEach(obj => availableTypes.add(obj.type));
    selectedTypes.forEach(type => availableTypes.add(type));
    const types = Array.from(availableTypes).sort();

    const objsForMunicipalities = getAvailableForFilter('municipalities');
    const availableMunicipalities = new Set<string>();
    objsForMunicipalities.forEach(obj => {
      const municipality = getMunicipalityForObject(obj, municipalitiesGeoJSON);
      if (municipality) {
        availableMunicipalities.add(municipality);
      }
    });
    selectedMunicipalities.forEach(m => availableMunicipalities.add(m));
    const municipalities = Array.from(availableMunicipalities).sort((a, b) => {
      const aName = municipalitiesGeoJSON.type === 'FeatureCollection'
        ? municipalitiesGeoJSON.features.find(f => 
            (f.properties?.id || f.properties?.name) === a
          )?.properties?.name || a
        : a;
      const bName = municipalitiesGeoJSON.type === 'FeatureCollection'
        ? municipalitiesGeoJSON.features.find(f => 
            (f.properties?.id || f.properties?.name) === b
          )?.properties?.name || b
        : b;
      return aName.localeCompare(bName, 'ru');
    });

    const objsForYears = getAvailableForFilter('years');
    const availableYears = new Set<number>();
    objsForYears.forEach(obj => {
      const year = new Date(obj.createdAt).getFullYear();
      availableYears.add(year);
    });
    selectedYears.forEach(year => availableYears.add(year));
    const years = Array.from(availableYears).sort((a, b) => b - a);

    const objsForMonths = getAvailableForFilter('months');
    const availableMonths = new Set<number>();
    objsForMonths.forEach(obj => {
      const month = new Date(obj.createdAt).getMonth() + 1;
      availableMonths.add(month);
    });
    selectedMonths.forEach(month => availableMonths.add(month));
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(m => 
      availableMonths.has(m) || selectedMonths.has(m)
    );

    return { years, months, types, municipalities };
  }, [allObjects, selectedTypes, selectedMunicipalities, selectedYears, selectedMonths, municipalitiesGeoJSON]);

  const getMunicipalityName = (id: string): string => {
    if (municipalitiesGeoJSON.type !== 'FeatureCollection') return id;
    const feature = municipalitiesGeoJSON.features.find(f => 
      (f.properties?.id || f.properties?.name) === id
    );
    return feature?.properties?.name || id;
  };

  const toggleFilter = (filterName: string) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  const handleTypeToggle = (type: ObjectType) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onTypesChange(newTypes);
  };

  const handleMunicipalityToggle = (municipality: string) => {
    const newMunicipalities = new Set(selectedMunicipalities);
    if (newMunicipalities.has(municipality)) {
      newMunicipalities.delete(municipality);
    } else {
      newMunicipalities.add(municipality);
    }
    onMunicipalitiesChange(newMunicipalities);
  };

  const handleYearToggle = (year: number) => {
    const newYears = new Set(selectedYears);
    if (newYears.has(year)) {
      newYears.delete(year);
    } else {
      newYears.add(year);
    }
    onYearsChange(newYears);
  };

  const handleMonthToggle = (month: number) => {
    const newMonths = new Set(selectedMonths);
    if (newMonths.has(month)) {
      newMonths.delete(month);
    } else {
      newMonths.add(month);
    }
    onMonthsChange(newMonths);
  };

  const selectAllTypes = () => {
    onTypesChange(new Set(availableOptions.types));
  };

  const clearAllTypes = () => {
    onTypesChange(new Set());
  };

  const selectAllMunicipalities = () => {
    onMunicipalitiesChange(new Set(availableOptions.municipalities));
  };

  const clearAllMunicipalities = () => {
    onMunicipalitiesChange(new Set());
  };

  const selectAllYears = () => {
    onYearsChange(new Set(availableOptions.years));
  };

  const clearAllYears = () => {
    onYearsChange(new Set());
  };

  const selectAllMonths = () => {
    onMonthsChange(new Set(availableOptions.months));
  };

  const clearAllMonths = () => {
    onMonthsChange(new Set());
  };

  const getTypesDisplay = () => {
    if (selectedTypes.size === 0) return 'Все типы';
    if (selectedTypes.size === availableOptions.types.length) return 'Все типы';
    if (selectedTypes.size === 1) {
      return OBJECT_TYPE_LABELS[Array.from(selectedTypes)[0]] || 'Выбрано';
    }
    return `Выбрано: ${selectedTypes.size}`;
  };

  const getMunicipalitiesDisplay = () => {
    if (selectedMunicipalities.size === 0) return 'Все МО';
    if (selectedMunicipalities.size === availableOptions.municipalities.length) return 'Все МО';
    if (selectedMunicipalities.size === 1) {
      return getMunicipalityName(Array.from(selectedMunicipalities)[0]);
    }
    return `Выбрано: ${selectedMunicipalities.size}`;
  };

  const getYearsDisplay = () => {
    if (selectedYears.size === 0) return 'Все годы';
    if (selectedYears.size === availableOptions.years.length) return 'Все годы';
    if (selectedYears.size === 1) {
      return Array.from(selectedYears)[0].toString();
    }
    return `Выбрано: ${selectedYears.size}`;
  };

  const getMonthsDisplay = () => {
    if (selectedMonths.size === 0) return 'Все месяцы';
    if (selectedMonths.size === availableOptions.months.length) return 'Все месяцы';
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    if (selectedMonths.size === 1) {
      return monthNames[Array.from(selectedMonths)[0] - 1];
    }
    return `Выбрано: ${selectedMonths.size}`;
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const hasActiveFilters = selectedTypes.size > 0 || selectedMunicipalities.size > 0 || 
                           selectedYears.size > 0 || selectedMonths.size > 0;

  if (isMobile && !isAccordionOpen) {
    return null;
  }

  return (
    <div className={`${isMobile ? 'relative' : 'sticky top-14 sm:top-16'} z-40 flex-shrink-0`}>
      <div>
        <div className={`flex items-center justify-between ${isMobile ? 'py-3 sm:py-3.5' : 'py-1.5'}`}>
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <h3 className={`${isMobile ? 'text-sm sm:text-base' : 'text-xs'} font-semibold text-foreground`}>Фильтры</h3>
            {externalIsAccordionOpen === undefined && (
              <button
                onClick={() => setIsAccordionOpen()}
                className="sm:hidden"
                aria-label={isAccordionOpen ? 'Свернуть фильтры' : 'Развернуть фильтры'}
              >
                <ChevronDownIcon className={`w-4 h-4 transition-transform text-muted-foreground ${isAccordionOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} text-muted-foreground hover:text-foreground flex items-center gap-1.5 ${isMobile ? 'px-2.5 sm:px-3 py-1.5 sm:py-2' : 'px-2 py-1'} rounded-md hover:bg-muted/50 transition-colors`}
            >
              <XMarkIcon className={`${isMobile ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-3.5 h-3.5'}`} />
              <span className="hidden sm:inline">Сбросить все</span>
              <span className="sm:hidden">Сброс</span>
            </button>
          )}
        </div>
        <div className={`transition-all duration-200 ${isMobile ? (isAccordionOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden') : 'max-h-none opacity-100'}`}>
          <div className={isMobile ? 'pb-3 sm:pb-4' : 'pb-2'}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${isMobile ? 'gap-3 sm:gap-4' : 'gap-2'}`}>
        <div className="relative" ref={typeDropdownRef}>
          <label className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-medium text-muted-foreground ${isMobile ? 'mb-2' : 'mb-1'} block`}>Тип объекта</label>
          <button
            onClick={() => toggleFilter('type')}
            className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 appearance-none cursor-pointer transition-all flex items-center justify-between`}
          >
            <span className="truncate">{getTypesDisplay()}</span>
            <ChevronDownIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} flex-shrink-0 transition-transform ${openFilter === 'type' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'type' && (
            <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <div className="p-1.5 border-b border-border/60 flex gap-1.5">
                <button
                  onClick={selectAllTypes}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Выбрать все
                </button>
                <button
                  onClick={clearAllTypes}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Сбросить
                </button>
              </div>
              {availableOptions.types.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} text-left hover:bg-muted/50 flex items-center justify-between transition-colors`}
                >
                  <span>{OBJECT_TYPE_LABELS[type]}</span>
                  {selectedTypes.has(type) && <CheckIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-foreground`} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={municipalityDropdownRef}>
          <label className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-medium text-muted-foreground ${isMobile ? 'mb-2' : 'mb-1'} block`}>Муниципалитет</label>
          <button
            onClick={() => toggleFilter('municipality')}
            className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 appearance-none cursor-pointer transition-all flex items-center justify-between`}
          >
            <span className="truncate">{getMunicipalitiesDisplay()}</span>
            <ChevronDownIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} flex-shrink-0 transition-transform ${openFilter === 'municipality' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'municipality' && (
            <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <div className="p-1.5 border-b border-border/60 flex gap-1.5">
                <button
                  onClick={selectAllMunicipalities}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Выбрать все
                </button>
                <button
                  onClick={clearAllMunicipalities}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Сбросить
                </button>
              </div>
              {availableOptions.municipalities.map((municipality) => (
                <button
                  key={municipality}
                  onClick={() => handleMunicipalityToggle(municipality)}
                  className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} text-left hover:bg-muted/50 flex items-center justify-between transition-colors`}
                >
                  <span className="truncate">{getMunicipalityName(municipality)}</span>
                  {selectedMunicipalities.has(municipality) && <CheckIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-foreground`} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={yearDropdownRef}>
          <label className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-medium text-muted-foreground ${isMobile ? 'mb-2' : 'mb-1'} block`}>Год</label>
          <button
            onClick={() => toggleFilter('year')}
            className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 appearance-none cursor-pointer transition-all flex items-center justify-between`}
          >
            <span className="truncate">{getYearsDisplay()}</span>
            <ChevronDownIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} flex-shrink-0 transition-transform ${openFilter === 'year' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'year' && (
            <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <div className="p-1.5 border-b border-border/60 flex gap-1.5">
                <button
                  onClick={selectAllYears}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Выбрать все
                </button>
                <button
                  onClick={clearAllYears}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Сбросить
                </button>
              </div>
              {availableOptions.years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearToggle(year)}
                  className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} text-left hover:bg-muted/50 flex items-center justify-between transition-colors`}
                >
                  <span>{year}</span>
                  {selectedYears.has(year) && <CheckIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-foreground`} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={monthDropdownRef}>
          <label className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-medium text-muted-foreground ${isMobile ? 'mb-2' : 'mb-1'} block`}>Месяц</label>
          <button
            onClick={() => toggleFilter('month')}
            className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 appearance-none cursor-pointer transition-all flex items-center justify-between`}
          >
            <span className="truncate">{getMonthsDisplay()}</span>
            <ChevronDownIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} flex-shrink-0 transition-transform ${openFilter === 'month' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'month' && (
            <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <div className="p-1.5 border-b border-border/60 flex gap-1.5">
                <button
                  onClick={selectAllMonths}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Выбрать все
                </button>
                <button
                  onClick={clearAllMonths}
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1.5 text-xs'} hover:bg-muted/50 rounded-md transition-colors`}
                >
                  Сбросить
                </button>
              </div>
              {availableOptions.months.map((month) => (
                <button
                  key={month}
                  onClick={() => handleMonthToggle(month)}
                  className={`w-full ${isMobile ? 'px-3 sm:px-4 py-2' : 'px-2.5 py-1.5'} ${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} text-left hover:bg-muted/50 flex items-center justify-between transition-colors`}
                >
                  <span>{monthNames[month - 1]}</span>
                  {selectedMonths.has(month) && <CheckIcon className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-foreground`} />}
                </button>
              ))}
            </div>
          )}
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

