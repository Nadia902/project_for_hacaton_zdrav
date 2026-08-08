import type {
  ApiClient,
  CreateObjectRequest,
  CreateRatingRequest,
  UpdateRatingRequest,
  CreateRouteRequest,
  GetObjectsParams,
  GetRatingsParams,
} from '@/types/api';
import type {
  InfrastructureObject,
  ObjectDetails,
  Rating,
  User,
  HealthRoute,
  CriteriaSet,
  PaginatedResponse,
  ApiResponse,
} from '@/types';
import { getAuthToken, removeAuthToken } from '@/lib/tokenStorage';

// Используем локальные Next.js API routes, которые проксируют запросы к бэкенду
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://158.160.177.129:8000/api';

class ApiClientImpl implements ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl?: string
  ): Promise<T> {
    const requestUrl = `${baseUrl || API_BASE_URL}${endpoint}`;
    
    // Получаем токен из localStorage и добавляем в заголовок Authorization
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(requestUrl, {
        ...options,
        headers,
        // Добавляем credentials для работы с CORS если нужно
        credentials: 'omit',
      });

      if (!response.ok) {
        // Если получен 401 (Unauthorized), удаляем токен из localStorage
        if (response.status === 401) {
          removeAuthToken();
          
          // Для /users/me возвращаем специальный объект с флагом unauthorized вместо выбрасывания ошибки
          if (endpoint === '/users/me') {
            // Пытаемся получить JSON, но не выбрасываем ошибку если не получается
            try {
              const text = await response.text();
              if (text) {
                try {
                  const errorData = JSON.parse(text);
                  // Обеспечиваем правильную структуру ApiResponse
                  return { 
                    ...errorData, 
                    data: errorData.data ?? null,
                    unauthorized: true 
                  } as T;
                } catch {
                  // Если не JSON, возвращаем объект с текстом
                  return { 
                    error: text, 
                    data: null, 
                    unauthorized: true 
                  } as T;
                }
              }
            } catch {
              // Если не удалось прочитать ответ, возвращаем базовый объект
            }
            return { 
              error: 'Unauthorized', 
              data: null, 
              unauthorized: true 
            } as T;
          }
        }
        
        // Пытаемся получить данные об ошибке
        // Сначала читаем как текст, чтобы можно было попробовать распарсить как JSON
        let errorData: any = null;
        let errorText: string = '';
        
        try {
          errorText = await response.text();
          if (errorText && errorText.trim()) {
            // Пытаемся распарсить как JSON
            try {
              errorData = JSON.parse(errorText);
              // Проверяем, что получили не пустой объект
              if (typeof errorData === 'object' && errorData !== null && Object.keys(errorData).length === 0) {
                errorData = null;
              }
            } catch {
              // Если не JSON, используем текст как есть
              errorData = { error: errorText, message: errorText };
            }
          }
        } catch (e) {
          // Если не удалось прочитать ответ
          errorText = '';
        }
        
        // Если errorData пустой или не содержит полезной информации, создаем информативный объект
        if (!errorData || (typeof errorData === 'object' && errorData !== null && Object.keys(errorData).length === 0)) {
          const errorMessage = errorText && errorText.trim() 
            ? errorText.trim() 
            : (response.statusText || `HTTP ${response.status}`);
          errorData = { 
            error: errorMessage,
            message: errorMessage
          };
        }
        
        // Не логируем ошибки для endpoint /users/me, если это 401 (не авторизован) - это нормальное состояние
        if (endpoint !== '/users/me' || response.status !== 401) {
          // Формируем более информативное сообщение для лога
          // Всегда гарантируем наличие базовых полей
          const logData: any = {
            url: requestUrl || 'unknown',
            endpoint: endpoint || 'unknown',
            status: response.status || 0,
            statusText: response.statusText || 'No status text',
          };
          
          // Добавляем информацию об ошибке, избегая пустых объектов
          let errorInfo: string | object = `HTTP ${response.status} ${response.statusText || 'Unknown error'}`;
          
          if (errorData && typeof errorData === 'object' && errorData !== null) {
            const errorKeys = Object.keys(errorData);
            // Фильтруем пустые значения и создаем чистый объект ошибки
            const cleanError: any = {};
            let hasValidData = false;
            
            for (const key of errorKeys) {
              const value = errorData[key];
              // Пропускаем null, undefined, пустые строки и пустые объекты
              if (value !== null && value !== undefined && value !== '') {
                if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
                  continue;
                }
                cleanError[key] = value;
                hasValidData = true;
              }
            }
            
            // Используем очищенный объект если есть данные, иначе строку
            if (hasValidData && Object.keys(cleanError).length > 0) {
              errorInfo = cleanError;
            }
          } else if (errorText && errorText.trim()) {
            errorInfo = errorText.trim();
          }
          
          logData.error = errorInfo;
        }
        
        // Формируем сообщение об ошибке
        let errorMessage: string;
        if (errorData && typeof errorData === 'object') {
          if ('error' in errorData && typeof errorData.error === 'string' && errorData.error) {
            errorMessage = errorData.error;
          } else if ('message' in errorData && typeof errorData.message === 'string' && errorData.message) {
            errorMessage = errorData.message;
          } else if (Object.keys(errorData).length > 0) {
            errorMessage = JSON.stringify(errorData);
          } else {
            errorMessage = `HTTP error! status: ${response.status} ${response.statusText || ''}`;
          }
        } else if (errorText) {
          errorMessage = errorText;
        } else {
          errorMessage = `HTTP error! status: ${response.status} ${response.statusText || ''}`;
        }
        
        throw new Error(errorMessage);
      }

      const jsonData = await response.json();
      
      return jsonData;
    } catch (error) {
      // Обработка сетевых ошибок и CORS
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running and CORS is configured.');
      }
      throw error;
    }
  }

  // Объекты
  async getObjects(params?: GetObjectsParams): Promise<PaginatedResponse<InfrastructureObject>> {
    const queryParams = new URLSearchParams();
    
    if (params?.types) {
      params.types.forEach(type => queryParams.append('types', type));
    }
    if (params?.minRating) {
      queryParams.append('minRating', params.minRating.toString());
    }
    if (params?.maxDistance) {
      queryParams.append('maxDistance', params.maxDistance.toString());
    }
    if (params?.center) {
      queryParams.append('lat', params.center.lat.toString());
      queryParams.append('lng', params.center.lng.toString());
    }
    if (params?.searchQuery) {
      queryParams.append('search', params.searchQuery);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/objects${query ? `?${query}` : ''}`;
    
    const result = await this.request<PaginatedResponse<InfrastructureObject>>(endpoint);
    
    return result;
  }

  async getObject(id: string): Promise<ApiResponse<ObjectDetails>> {
    return this.request<ApiResponse<ObjectDetails>>(`/object/id/${id}`);
  }

  async createObject(data: CreateObjectRequest): Promise<ApiResponse<InfrastructureObject>> {
    return this.request<ApiResponse<InfrastructureObject>>('/objects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateObject(
    id: string,
    data: Partial<CreateObjectRequest>
  ): Promise<ApiResponse<InfrastructureObject>> {
    return this.request<ApiResponse<InfrastructureObject>>(`/objects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteObject(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/objects/${id}`, {
      method: 'DELETE',
    });
  }

  // Оценки
  async getRatings(params?: GetRatingsParams): Promise<PaginatedResponse<Rating>> {
    const queryParams = new URLSearchParams();
    
    if (params?.objectId) {
      queryParams.append('objectId', params.objectId);
    }
    if (params?.userId) {
      queryParams.append('userId', params.userId);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Rating>>(
      `/ratings${query ? `?${query}` : ''}`
    );
  }

  async getRating(id: string): Promise<ApiResponse<Rating>> {
    return this.request<ApiResponse<Rating>>(`/ratings/${id}`);
  }

  async createRating(data: CreateRatingRequest): Promise<ApiResponse<Rating>> {
    return this.request<ApiResponse<Rating>>('/ratings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRating(data: UpdateRatingRequest): Promise<ApiResponse<Rating>> {
    const { id, ...updateData } = data;
    return this.request<ApiResponse<Rating>>(`/ratings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async deleteRating(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/ratings/${id}`, {
      method: 'DELETE',
    });
  }

  // Критерии
  async getCriteriaSets(): Promise<ApiResponse<CriteriaSet[]>> {
    return this.request<ApiResponse<CriteriaSet[]>>('/criteria-sets');
  }

  async getCriteriaSet(objectType: string): Promise<ApiResponse<CriteriaSet>> {
    return this.request<ApiResponse<CriteriaSet>>(`/criteria-sets/${objectType}`);
  }

  // Пользователи
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/users/me');
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>(`/users/${id}`);
  }

  // Маршруты
  async getRoutes(userId?: string): Promise<ApiResponse<HealthRoute[]>> {
    const query = userId ? `?userId=${userId}` : '';
    return this.request<ApiResponse<HealthRoute[]>>(`/routes${query}`);
  }

  async createRoute(data: CreateRouteRequest): Promise<ApiResponse<HealthRoute>> {
    return this.request<ApiResponse<HealthRoute>>('/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRoute(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/routes/${id}`, {
      method: 'DELETE',
    });
  }

  // Аналитика
  async getHealthIndex(
    bounds?: { north: number; south: number; east: number; west: number }
  ): Promise<ApiResponse<Array<{ lat: number; lng: number; value: number }>>> {
    const queryParams = new URLSearchParams();
    
    if (bounds) {
      queryParams.append('north', bounds.north.toString());
      queryParams.append('south', bounds.south.toString());
      queryParams.append('east', bounds.east.toString());
      queryParams.append('west', bounds.west.toString());
    }

    const query = queryParams.toString();
    return this.request<ApiResponse<Array<{ lat: number; lng: number; value: number }>>>(
      `/analytics/health-index${query ? `?${query}` : ''}`
    );
  }

  // Метрики для лендинга (используют локальные proxy routes, которые проксируют запросы к удаленному серверу)
  // Это обходит проблемы с CORS, так как запросы идут через Next.js сервер
  async getObjectsCount(): Promise<{ count: number }> {
    // Используем локальный proxy route, который проксирует запрос к удаленному серверу
    return this.request<{ count: number }>('/objects/count');
  }

  async getRatingsCount(): Promise<{ count: number }> {
    // Используем локальный proxy route, который проксирует запрос к удаленному серверу
    return this.request<{ count: number }>('/ratings/count');
  }

  async getUsersCount(): Promise<{ count: number }> {
    // Используем локальный proxy route, который проксирует запрос к удаленному серверу
    return this.request<{ count: number }>('/users/count');
  }

  // Рейтинги
  async getMunicipalityHealthIndex(): Promise<ApiResponse<Array<{
    mo: string;
    health_index: number;
    total_ratings: number;
    population: number;
    ratings_per_1000: number;
  }>>> {
    // Используем локальный proxy route, который проксирует запрос к удаленному серверу
    return this.request<ApiResponse<Array<{
      mo: string;
      health_index: number;
      total_ratings: number;
      population: number;
      ratings_per_1000: number;
    }>>>(`/analytics/health-index`);
  }

  async getTopUsers(limit: number = 10): Promise<ApiResponse<Array<{
    login: string;
    avatar_url: string;
    points: number;
    lvl: string;
  }>>> {
    // Используем локальный proxy route, который проксирует запрос к удаленному серверу
    return this.request<ApiResponse<Array<{
      login: string;
      avatar_url: string;
      points: number;
      lvl: string;
    }>>>(`/users/top?limit=${limit}`);
  }
}

export const apiClient = new ApiClientImpl();

