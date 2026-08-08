import { create } from 'zustand';
import type { InfrastructureObject, ObjectType } from '@/types';

interface MapState {
  selectedObject: InfrastructureObject | null;
  selectedType: ObjectType | null;
  filters: {
    types?: ObjectType[];
    minRating?: number; // Оставляем для обратной совместимости
    ratingRanges?: [number, number][]; // Новое поле для диапазонов рейтинга
    maxDistance?: number;
    searchQuery?: string;
  };
  setSelectedObject: (object: InfrastructureObject | null) => void;
  setSelectedType: (type: ObjectType | null) => void;
  setFilters: (filters: Partial<MapState['filters']>) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedObject: null,
  selectedType: null,
  filters: {},
  setSelectedObject: (object) => set({ selectedObject: object }),
  setSelectedType: (type) => set({ selectedType: type }),
  setFilters: (newFilters) =>
    set((state) => {
      // Проверяем, действительно ли что-то изменилось
      const typesChanged = 
        (newFilters.types !== undefined && 
         (state.filters.types === undefined || 
          newFilters.types.length !== state.filters.types.length ||
          !newFilters.types.every((type, i) => type === state.filters.types?.[i]))) ||
        (newFilters.types === undefined && state.filters.types !== undefined);
      
      const minRatingChanged = 
        (newFilters.minRating !== undefined && newFilters.minRating !== state.filters.minRating) ||
        (newFilters.minRating === undefined && state.filters.minRating !== undefined);

      const ratingRangesChanged =
        (newFilters.ratingRanges !== undefined &&
         (state.filters.ratingRanges === undefined ||
          newFilters.ratingRanges.length !== state.filters.ratingRanges.length ||
          !newFilters.ratingRanges.every((range, i) => 
            state.filters.ratingRanges?.[i] && 
            range[0] === state.filters.ratingRanges[i][0] && 
            range[1] === state.filters.ratingRanges[i][1]
          ))) ||
        (newFilters.ratingRanges === undefined && state.filters.ratingRanges !== undefined);
      
      const hasChanges = typesChanged || minRatingChanged || ratingRangesChanged;
      
      if (!hasChanges) {
        return state; // Не обновляем, если ничего не изменилось
      }
      
      return {
        filters: { ...state.filters, ...newFilters },
      };
    }),
}));



