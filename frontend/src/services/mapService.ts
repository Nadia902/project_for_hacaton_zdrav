import { apiClient } from '@/lib/api';
import type { InfrastructureObject, ObjectFilters } from '@/types';

export const mapService = {
  async getObjects(filters?: ObjectFilters) {
    return apiClient.getObjects(filters);
  },

  async getObject(id: string) {
    return apiClient.getObject(id);
  },

  async createObject(data: {
    name: string;
    type: string;
    description?: string;
    location: { lat: number; lng: number; address?: string };
  }) {
    return apiClient.createObject(data);
  },
};






