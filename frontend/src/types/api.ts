import type {
  InfrastructureObject,
  ObjectDetails,
  Rating,
  User,
  HealthRoute,
  ObjectFilters,
  CriteriaSet,
  PaginatedResponse,
  ApiResponse,
} from './index';

// API Endpoints типы
export interface CreateObjectRequest {
  name: string;
  type: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface CreateRatingRequest {
  objectId: string;
  criterionRatings: Array<{
    criterionId: string;
    value: number | string;
  }>;
  comment?: string;
  photos?: string[];
}

export interface UpdateRatingRequest extends Partial<CreateRatingRequest> {
  id: string;
}

export interface CreateRouteRequest {
  name: string;
  description?: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    objectId?: string;
  }>;
}

// API Client типы
export type GetObjectsParams = ObjectFilters & {
  page?: number;
  limit?: number;
};

export type GetRatingsParams = {
  objectId?: string;
  userId?: string;
  page?: number;
  limit?: number;
};

// API методы
export interface ApiClient {
  // Объекты
  getObjects(params?: GetObjectsParams): Promise<PaginatedResponse<InfrastructureObject>>;
  getObject(id: string): Promise<ApiResponse<ObjectDetails>>;
  createObject(data: CreateObjectRequest): Promise<ApiResponse<InfrastructureObject>>;
  updateObject(id: string, data: Partial<CreateObjectRequest>): Promise<ApiResponse<InfrastructureObject>>;
  deleteObject(id: string): Promise<ApiResponse<void>>;

  // Оценки
  getRatings(params?: GetRatingsParams): Promise<PaginatedResponse<Rating>>;
  getRating(id: string): Promise<ApiResponse<Rating>>;
  createRating(data: CreateRatingRequest): Promise<ApiResponse<Rating>>;
  updateRating(data: UpdateRatingRequest): Promise<ApiResponse<Rating>>;
  deleteRating(id: string): Promise<ApiResponse<void>>;

  // Критерии
  getCriteriaSets(): Promise<ApiResponse<CriteriaSet[]>>;
  getCriteriaSet(objectType: string): Promise<ApiResponse<CriteriaSet>>;

  // Пользователи
  getCurrentUser(): Promise<ApiResponse<User>>;
  getUser(id: string): Promise<ApiResponse<User>>;

  // Маршруты
  getRoutes(userId?: string): Promise<ApiResponse<HealthRoute[]>>;
  createRoute(data: CreateRouteRequest): Promise<ApiResponse<HealthRoute>>;
  deleteRoute(id: string): Promise<ApiResponse<void>>;

  // Аналитика
  getHealthIndex(bounds?: { north: number; south: number; east: number; west: number }): Promise<ApiResponse<Array<{ lat: number; lng: number; value: number }>>>;

  // Метрики для лендинга
  getObjectsCount(): Promise<{ count: number }>;
  getRatingsCount(): Promise<{ count: number }>;
  getUsersCount(): Promise<{ count: number }>;

  // Рейтинги
  getMunicipalityHealthIndex(): Promise<ApiResponse<Array<{
    mo: string;
    health_index: number;
    total_ratings: number;
    population: number;
    ratings_per_1000: number;
  }>>>;
  getTopUsers(limit?: number): Promise<ApiResponse<Array<{
    login: string;
    avatar_url: string;
    points: number;
    lvl: string;
  }>>>;
}





