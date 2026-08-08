import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { mapMunicipalityName } from '@/lib/municipalityNameMapping';

export interface MunicipalityHealthIndex {
  mo: string;
  health_index: number;
  total_ratings: number;
  population: number;
  ratings_per_1000: number;
}

export function useMunicipalityHealthIndex() {
  const [data, setData] = useState<Map<string, MunicipalityHealthIndex>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.getMunicipalityHealthIndex();
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const healthIndexMap = new Map<string, MunicipalityHealthIndex>();
          response.data.forEach((item) => {
            healthIndexMap.set(item.mo, item);
          });
          setData(healthIndexMap);
        } else {
          setData(new Map());
        }
      } catch (err) {
        setData(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getHealthIndex = (municipalityName: string | undefined | null): number | null => {
    if (!municipalityName) return null;
    
    const apiName = mapMunicipalityName(municipalityName);
    const item = data.get(apiName);
    return item ? item.health_index : null;
  };

  const getMunicipalityData = (municipalityName: string | undefined | null): MunicipalityHealthIndex | null => {
    if (!municipalityName) return null;
    
    const apiName = mapMunicipalityName(municipalityName);
    return data.get(apiName) || null;
  };

  return {
    data,
    isLoading,
    error,
    getHealthIndex,
    getMunicipalityData,
  };
}

