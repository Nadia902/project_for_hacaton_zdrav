'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/store/mapStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ChevronDownIcon, FunnelIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getMarkerIconComponent } from '@/lib/map';
import type { ObjectType } from '@/types';

interface ObjectTypeFilter {
  id: string;
  label: string;
  type: ObjectType;
  checked: boolean;
}

const objectTypeFilters: ObjectTypeFilter[] = [
  { id: 'healthy_food', label: 'Здоровое питание', type: 'healthy_food', checked: true },
  { id: 'alcohol_tobacco', label: 'Алкоголь и табак', type: 'alcohol_tobacco', checked: true },
  { id: 'health_facilities', label: 'Объекты здоровья', type: 'health_facilities', checked: true },
  { id: 'industrial', label: 'Промышленные', type: 'industrial', checked: true },
  { id: 'waste_collection', label: 'Сбор мусора', type: 'waste_collection', checked: true },
  { id: 'education', label: 'Образование', type: 'education', checked: true },
  { id: 'medical', label: 'Медицина', type: 'medical', checked: true },
];

interface ControlPanelProps {}

export function ControlPanel({}: ControlPanelProps) {
  const isMobile = useIsMobile();
  const { filters, setFilters } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Состояния для аккордеонов
  const [isObjectTypesOpen, setIsObjectTypesOpen] = useState(false);
  
  // Временные состояния для выбранных фильтров (еще не применены)
  const [tempSelectedObjectTypes, setTempSelectedObjectTypes] = useState<Set<string>>(
    new Set(objectTypeFilters.map(f => f.id))
  );

  // Сохраняем примененные фильтры для восстановления при отмене
  const appliedObjectTypesRef = useRef<Set<string>>(new Set(objectTypeFilters.map(f => f.id)));

  // Инициализация примененных фильтров из store при первом монтировании
  useEffect(() => {
    // Восстанавливаем выбранные типы из store
    if (filters.types && filters.types.length > 0) {
      const selectedTypes = new Set(
        objectTypeFilters
          .filter(f => filters.types!.includes(f.type))
          .map(f => f.id)
      );
      appliedObjectTypesRef.current = selectedTypes;
    } else {
      appliedObjectTypesRef.current = new Set(objectTypeFilters.map(f => f.id));
    }
  }, []); // Выполняется только при монтировании

  // Инициализация временных значений из примененных фильтров при открытии
  useEffect(() => {
    if (isOpen) {
      // Восстанавливаем временные значения из примененных фильтров
      setTempSelectedObjectTypes(new Set(appliedObjectTypesRef.current));
    }
  }, [isOpen]);

  // Сброс всех фильтров (снимает все чекбоксы)
  const handleResetAll = useCallback(() => {
    setTempSelectedObjectTypes(new Set());
  }, []);

  // Выбрать все фильтры
  const handleSelectAll = useCallback(() => {
    setTempSelectedObjectTypes(new Set(objectTypeFilters.map(f => f.id)));
  }, []);

  // Сброс типов объектов
  const handleResetObjectTypes = useCallback(() => {
    setTempSelectedObjectTypes(new Set());
  }, []);

  // Выбрать все типы объектов
  const handleSelectAllObjectTypes = useCallback(() => {
    setTempSelectedObjectTypes(new Set(objectTypeFilters.map(f => f.id)));
  }, []);

  // Применение фильтров
  const handleApply = useCallback(() => {
    // Сохраняем текущие временные значения как примененные
    appliedObjectTypesRef.current = new Set(tempSelectedObjectTypes);

    // Вычисляем примененные типы
    const appliedTypes = objectTypeFilters
      .filter(f => tempSelectedObjectTypes.has(f.id))
      .map(f => f.type);

    // Применяем фильтры к store
    setFilters({ 
      types: appliedTypes.length > 0 ? appliedTypes : undefined,
      ratingRanges: undefined,
      minRating: undefined,
    });

    // Сворачиваем панель
    setIsOpen(false);
  }, [tempSelectedObjectTypes, setFilters]);

  // Отмена изменений
  const handleCancel = useCallback(() => {
    // Восстанавливаем временные значения из примененных
    setTempSelectedObjectTypes(new Set(appliedObjectTypesRef.current));
    // Сворачиваем панель
    setIsOpen(false);
  }, []);

  const handleObjectTypeToggle = useCallback((filterId: string, type: ObjectType) => {
    setTempSelectedObjectTypes((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(filterId)) {
        newSelected.delete(filterId);
      } else {
        newSelected.add(filterId);
      }
      return newSelected;
    });
  }, []);

  // Проверяем, есть ли изменения
  const hasChanges = useMemo(() => {
    const typesChanged = 
      tempSelectedObjectTypes.size !== appliedObjectTypesRef.current.size ||
      !Array.from(tempSelectedObjectTypes).every(id => appliedObjectTypesRef.current.has(id));

    return typesChanged;
  }, [tempSelectedObjectTypes]);

  // Проверяем, все ли фильтры сброшены
  const allTypesDeselected = tempSelectedObjectTypes.size === 0;
  const allDeselected = allTypesDeselected;
  
  // Проверяем, все ли типы выбраны
  const allObjectTypesSelected = tempSelectedObjectTypes.size === objectTypeFilters.length;


  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`fixed ${isMobile ? 'top-20 left-2' : 'top-20 left-4'} z-[60] bg-background/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-w-sm ${isMobile ? 'w-[calc(100vw-1rem)]' : 'w-[calc(100vw-2rem)] sm:w-80'} transition-all duration-300 max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden`}
    >
      {/* Декоративный градиент сверху */}
      <div className="absolute top-12 left-0 right-0 h-24 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      
      {/* Заголовок с кнопкой сворачивания */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between flex-shrink-0 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm">Фильтры</h3>
        </div>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors"
          aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
        >
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden flex flex-col"
          >
            <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-320px)] overflow-y-auto relative z-10 flex-1">
              {/* Фильтры по типам объектов - Аккордеон */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border border-border/50 rounded-lg overflow-hidden bg-background/50"
              >
                {/* Заголовок аккордеона */}
                <div
                  onClick={() => setIsObjectTypesOpen(!isObjectTypesOpen)}
                  className="w-full p-3 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <h4 className="text-xs font-semibold text-foreground uppercase flex items-center gap-2">
                    Типы объектов
                  </h4>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {!allObjectTypesSelected && (
                        <button
                          onClick={handleSelectAllObjectTypes}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/30"
                        >
                          Выбрать все
                        </button>
                      )}
                      {tempSelectedObjectTypes.size > 0 && (
                        <button
                          onClick={handleResetObjectTypes}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/30"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                    <ChevronDownIcon
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        isObjectTypesOpen ? '' : 'rotate-180'
                      }`}
                    />
                  </div>
                </div>

                {/* Содержимое аккордеона */}
                <AnimatePresence>
                  {isObjectTypesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 space-y-2">
                        {objectTypeFilters.map((filter, index) => (
                          <motion.label
                            key={filter.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 cursor-pointer hover:bg-accent/30 p-2.5 rounded-lg transition-all duration-200 group"
                          >
                            <input
                              type="checkbox"
                              checked={tempSelectedObjectTypes.has(filter.id)}
                              onChange={() => handleObjectTypeToggle(filter.id, filter.type)}
                              className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0 transition-all group-hover:border-primary/50"
                            />
                            {(() => {
                              const IconComponent = getMarkerIconComponent(filter.type);
                              return <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />;
                            })()}
                            <span className="text-sm font-medium flex-1">{filter.label}</span>
                          </motion.label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Кнопки общего управления */}
              <div className="flex gap-2 pt-2">
                <motion.button
                  onClick={handleSelectAll}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                >
                  Выбрать все
                </motion.button>
                <motion.button
                  onClick={handleResetAll}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  disabled={allDeselected}
                >
                  Сбросить все
                </motion.button>
              </div>
            </div>

            {/* Кнопки управления */}
            <div className="p-4 border-t border-border/50 flex gap-2 flex-shrink-0 bg-background/50 backdrop-blur-sm relative z-10">
              <motion.button
                onClick={handleCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Отменить
              </motion.button>
              <motion.button
                onClick={handleApply}
                disabled={!hasChanges || allTypesDeselected}
                whileHover={hasChanges && !allTypesDeselected ? { scale: 1.02 } : {}}
                whileTap={hasChanges && !allTypesDeselected ? { scale: 0.98 } : {}}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  hasChanges && !allTypesDeselected
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <CheckIcon className="w-4 h-4" />
                Применить
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

