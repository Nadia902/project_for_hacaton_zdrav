import { NextResponse } from 'next/server';
import type { CriteriaSet } from '@/types';

// Предопределенные наборы критериев
const criteriaSets: CriteriaSet[] = [
  {
    id: 'healthy_food',
    name: 'Точки здорового питания',
    objectTypes: ['healthy_food'],
    criteria: [
      {
        id: 'product_quality',
        name: 'Качество продуктов',
        description: 'Качество предлагаемых продуктов',
        type: 'rating',
        weight: 0.25,
      },
      {
        id: 'product_range',
        name: 'Ассортимент товаров',
        description: 'Широта и разнообразие ассортимента',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'price_accessibility',
        name: 'Доступность цен',
        description: 'Соответствие цен качеству и доступность',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'sanitary_condition',
        name: 'Санитарное состояние',
        description: 'Чистота помещений и соблюдение санитарных норм',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'location',
        name: 'Расположение',
        description: 'Удобство расположения и доступность',
        type: 'rating',
        weight: 0.15,
      },
    ],
  },
  {
    id: 'alcohol_tobacco',
    name: 'Точки продажи алкоголя и табака',
    objectTypes: ['alcohol_tobacco'],
    criteria: [
      {
        id: 'distance_from_social',
        name: 'Удаленность от социальных объектов',
        description: 'Расстояние от школ, детских садов и других социальных объектов',
        type: 'rating',
        weight: 0.25,
      },
      {
        id: 'price_accessibility',
        name: 'Доступность цен',
        description: 'Обратный показатель: чем выше стоимость, тем лучше',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'law_compliance',
        name: 'Соблюдение закона',
        description: 'Не продают несовершеннолетним и вне времени продаж',
        type: 'rating',
        weight: 0.30,
      },
      {
        id: 'sanitary_condition',
        name: 'Санитарное состояние',
        description: 'Чистота помещений и соблюдение санитарных норм',
        type: 'rating',
        weight: 0.15,
      },
      {
        id: 'warning_labels',
        name: 'Наличие предупреждений о вреде продукции',
        description: 'Наличие и заметность предупреждений о вреде',
        type: 'rating',
        weight: 0.10,
      },
    ],
  },
  {
    id: 'health_facilities',
    name: 'Объекты для поддержания здоровья',
    objectTypes: ['health_facilities'],
    criteria: [
      {
        id: 'price_accessibility',
        name: 'Доступность цен',
        description: 'Соответствие цен качеству и доступность',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'location',
        name: 'Расположение',
        description: 'Удобство расположения и доступность',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'condition',
        name: 'Состояние объекта',
        description: 'Общее состояние и ухоженность объекта',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'safety',
        name: 'Безопасность',
        description: 'Уровень безопасности для посетителей',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'equipment',
        name: 'Оснащенность',
        description: 'Оборудование, навигация и прочие удобства',
        type: 'rating',
        weight: 0.20,
      },
    ],
  },
  {
    id: 'industrial',
    name: 'Промышленные объекты',
    objectTypes: ['industrial'],
    criteria: [
      {
        id: 'distance_from_social',
        name: 'Удаленность от социальных объектов',
        description: 'Расстояние от школ, детских садов и других социальных объектов',
        type: 'rating',
        weight: 0.30,
      },
      {
        id: 'pollution_level',
        name: 'Уровень загрязнения окружающей среды',
        description: 'Влияние на экологию и окружающую среду',
        type: 'rating',
        weight: 0.40,
      },
      {
        id: 'noise_level',
        name: 'Уровень шума',
        description: 'Шумовое воздействие на окружающую среду',
        type: 'rating',
        weight: 0.30,
      },
    ],
  },
  {
    id: 'waste_collection',
    name: 'Точки сбора мусора',
    objectTypes: ['waste_collection'],
    criteria: [
      {
        id: 'distance_from_social',
        name: 'Удаленность от социальных объектов',
        description: 'Расстояние от школ, детских садов и других социальных объектов',
        type: 'rating',
        weight: 0.35,
      },
      {
        id: 'pollution_level',
        name: 'Уровень загрязнения окружающей среды',
        description: 'Влияние на экологию и окружающую среду',
        type: 'rating',
        weight: 0.40,
      },
      {
        id: 'collection_frequency',
        name: 'Регулярность вывоза мусора',
        description: 'Частота и регулярность вывоза мусора',
        type: 'rating',
        weight: 0.25,
      },
    ],
  },
  {
    id: 'education',
    name: 'Образовательные учреждения',
    objectTypes: ['education'],
    criteria: [
      {
        id: 'location',
        name: 'Расположение',
        description: 'Удобство расположения и доступность',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'condition',
        name: 'Состояние объекта',
        description: 'Общее состояние и ухоженность объекта',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'safety',
        name: 'Безопасность',
        description: 'Уровень безопасности для учащихся',
        type: 'rating',
        weight: 0.25,
      },
      {
        id: 'sanitary_condition',
        name: 'Санитарное состояние',
        description: 'Чистота помещений и соблюдение санитарных норм',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'distance_from_hazards',
        name: 'Удаленность от источников вредного воздействия',
        description: 'Расстояние от промышленных объектов, свалок и т.д.',
        type: 'rating',
        weight: 0.15,
      },
    ],
  },
  {
    id: 'medical',
    name: 'Медицинские организации',
    objectTypes: ['medical'],
    criteria: [
      {
        id: 'location',
        name: 'Расположение',
        description: 'Удобство расположения и доступность',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'products_services',
        name: 'Количество товаров и услуг',
        description: 'Широта ассортимента и перечень услуг',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'condition',
        name: 'Состояние объекта',
        description: 'Общее состояние и ухоженность объекта',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'sanitary_condition',
        name: 'Санитарное состояние',
        description: 'Чистота помещений и соблюдение санитарных норм',
        type: 'rating',
        weight: 0.20,
      },
      {
        id: 'distance_from_hazards',
        name: 'Удаленность от источников вредного воздействия',
        description: 'Расстояние от промышленных объектов, свалок и т.д.',
        type: 'rating',
        weight: 0.20,
      },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    data: criteriaSets,
  });
}





