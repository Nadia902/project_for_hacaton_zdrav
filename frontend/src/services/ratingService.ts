import { apiClient } from '@/lib/api';
import type { CreateRatingRequest, UpdateRatingRequest } from '@/types/api';

export const ratingService = {
  async getRatings(objectId?: string, userId?: string) {
    return apiClient.getRatings({ objectId, userId });
  },

  async createRating(data: CreateRatingRequest) {
    return apiClient.createRating(data);
  },

  async updateRating(data: UpdateRatingRequest) {
    return apiClient.updateRating(data);
  },

  async deleteRating(id: string) {
    return apiClient.deleteRating(id);
  },

  async getCriteriaSet(objectType: string) {
    return apiClient.getCriteriaSet(objectType);
  },
};






