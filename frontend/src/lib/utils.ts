// Утилиты для форматирования
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Форматирование расстояния
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}

// Вычисление расстояния между двумя точками (формула гаверсинуса)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Форматирование рейтинга
export function formatRating(rating: number | undefined): string {
  if (rating === undefined || rating === null) {
    return 'Нет оценок';
  }
  return rating.toFixed(1);
}

// Получение цвета по индексу здоровья
export function getHealthIndexColor(value: number): string {
  if (value >= 80) return '#22c55e'; // green-500
  if (value >= 60) return '#84cc16'; // lime-500
  if (value >= 40) return '#eab308'; // yellow-500
  if (value >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

// Получение названия типа объекта
export function getObjectTypeName(type: string): string {
  const names: Record<string, string> = {
    healthy_food: 'Точки здорового питания',
    alcohol_tobacco: 'Точки продажи алкоголя и табака',
    health_facilities: 'Объекты для поддержания здоровья',
    industrial: 'Промышленные объекты',
    waste_collection: 'Точки сбора мусора',
    education: 'Образовательные учреждения',
    medical: 'Медицинские организации',
  };
  return names[type] || type;
}

// Получение русского названия критерия по его ID
export function getCriterionName(criterionId: string): string {
  const names: Record<string, string> = {
    // Общие критерии
    price_accessibility: 'Доступность цен',
    sanitary_condition: 'Санитарное состояние',
    location: 'Расположение',
    condition: 'Состояние объекта',
    safety: 'Безопасность',
    equipment: 'Оснащенность',
    
    // Для точек здорового питания
    product_quality: 'Качество продуктов',
    product_range: 'Ассортимент товаров',
    
    // Для точек продажи алкоголя и табака
    distance_from_social: 'Удаленность от социальных объектов',
    law_compliance: 'Соблюдение закона',
    warning_labels: 'Наличие предупреждений о вреде продукции',
    
    // Для промышленных объектов и точек сбора мусора
    pollution_level: 'Уровень загрязнения окружающей среды',
    noise_level: 'Уровень шума',
    collection_frequency: 'Регулярность вывоза мусора',
    
    // Для образовательных учреждений и медицинских организаций
    distance_from_hazards: 'Удаленность от источников вредного воздействия',
    products_services: 'Количество товаров и услуг',
  };
  return names[criterionId] || criterionId;
}

// Класс для объединения CSS классов
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Проверка, можно ли редактировать отзыв (в течение 10 минут после создания)
export function canEditRating(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const minutesSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60);
  return minutesSinceCreation <= 10;
}

// Получение оставшегося времени для редактирования в минутах
export function getRemainingEditTime(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const minutesSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60);
  return Math.max(0, Math.ceil(10 - minutesSinceCreation));
}

/**
 * Преобразует avatar_url от Яндекса в полный URL
 * @param avatarUrl - Путь аватара от Яндекса (например, "28053/RazL3cwAD12DGRwZ7AsMN0V1PDo-1")
 * @returns Полный URL аватара Яндекса
 */
export function getYandexAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  
  // Если уже полный URL, возвращаем как есть
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // Формируем полный URL для аватара Яндекса
  // Формат: https://avatars.yandex.net/get-yapic/{avatar_url}/islands-200
  return `https://avatars.yandex.net/get-yapic/${avatarUrl}/islands-200`;
}



