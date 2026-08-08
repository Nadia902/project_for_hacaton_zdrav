// Типы для объектов инфраструктуры
export type ObjectType = 
  | 'healthy_food'      // Точки здорового питания
  | 'alcohol_tobacco'   // Точки продажи алкоголя и табака
  | 'health_facilities' // Объекты для поддержания здоровья
  | 'industrial'        // Промышленные объекты
  | 'waste_collection'  // Точки сбора мусора
  | 'education'         // Образовательные учреждения
  | 'medical';          // Медицинские организации

// Критерии оценки для разных типов объектов
export interface Criteria {
  id: string;
  name: string;
  description?: string;
  type: 'rating' | 'slider' | 'select'; // Тип ввода
  options?: string[]; // Для типа 'select'
  min?: number; // Для типа 'slider'
  max?: number; // Для типа 'slider'
  weight?: number; // Вес критерия в общей оценке (0-1)
}

export interface CriteriaSet {
  id: string;
  name: string;
  objectTypes: ObjectType[];
  criteria: Criteria[];
}

// Оценка по критерию
export interface CriterionRating {
  criterionId: string;
  value: number | string;
}

// Полная оценка объекта
export interface Rating {
  id: string;
  objectId: string;
  userId: string;
  criterionRatings: CriterionRating[];
  comment?: string;
  photos?: string[]; // URLs фотографий
  createdAt: string;
  updatedAt: string;
}

// Объект инфраструктуры
export interface InfrastructureObject {
  id: string;
  name: string;
  type: ObjectType;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  averageRating?: number; // Средний рейтинг по всем критериям (средний балл на основе оценок пользователей)
  ratingsCount: number; // Количество оценок
  ratedByUserIds?: string[]; // ID пользователей, которые проставили оценку
  healthIndex?: number; // Индекс здоровья (0-100)
  mo?: string; // Медицинская организация / Район
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Детальная информация об объекте с оценками
export interface ObjectDetails extends InfrastructureObject {
  ratings: Rating[];
  criteriaSet?: CriteriaSet;
  averageCriterionRatings: Record<string, number>; // Средние оценки по каждому критерию
  photos?: string[]; // URLs фотографий объекта
  contactInfo?: {
    phone?: string;
    website?: string;
    hours?: string;
  };
}

// Пользователь
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  points?: number; // Баллы за активность
  badges?: string[]; // Значки
  level?: string; // Звание
  createdAt: string;
}

// Личный маршрут
export interface HealthRoute {
  id: string;
  userId: string;
  name: string;
  description?: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    objectId?: string; // Привязка к объекту
  }>;
  rating?: number;
  createdAt: string;
}

// Фильтры для поиска объектов
export interface ObjectFilters {
  types?: ObjectType[];
  minRating?: number;
  maxDistance?: number; // В метрах
  center?: { lat: number; lng: number };
  searchQuery?: string;
}

// Данные для тепловой карты
export interface HeatmapData {
  lat: number;
  lng: number;
  value: number; // Индекс здоровья (0-100)
}

// API Response типы
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}



