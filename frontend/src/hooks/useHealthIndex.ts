'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function useHealthIndex(bounds?: Bounds) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health-index', bounds],
    queryFn: async () => {
      const response = await apiClient.getHealthIndex(bounds);
      return response.data;
    },
    enabled: !!bounds,
  });

  return {
    heatmapData: data || [],
    isLoading,
    error,
  };
}






