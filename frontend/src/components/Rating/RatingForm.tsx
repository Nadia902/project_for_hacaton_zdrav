'use client';

import { useState, useEffect, useRef } from 'react';
import { CriteriaSelector } from './CriteriaSelector';
import { useUserStore } from '@/store/userStore';
import { AuthModal } from '@/components/UI/AuthModal';
import type { CriteriaSet, CriterionRating } from '@/types';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface RatingFormProps {
  objectId: string;
  objectType: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialRating?: {
    id?: string;
    criterionRatings: CriterionRating[];
    comment?: string;
    photos?: string[];
  };
  isEditMode?: boolean;
}

export function RatingForm({
  objectId,
  objectType,
  onSuccess,
  onCancel,
  initialRating,
  isEditMode = false,
}: RatingFormProps) {
  const { user } = useUserStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [criteriaSet, setCriteriaSet] = useState<CriteriaSet | null>(null);
  const [values, setValues] = useState<Record<string, number | string>>({});
  const [comment, setComment] = useState(initialRating?.comment || '');
  const [photos, setPhotos] = useState<string[]>(initialRating?.photos || []);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCriteriaSet();
    if (initialRating) {
      const initialValues: Record<string, number | string> = {};
      initialRating.criterionRatings.forEach((cr) => {
        initialValues[cr.criterionId] = cr.value;
      });
      setValues(initialValues);
      if (initialRating.photos) {
        setPhotos(initialRating.photos);
        setPhotoPreviews(initialRating.photos);
      }
    }
  }, [objectType, initialRating]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxPhotos = 5;
    const remainingSlots = maxPhotos - photos.length - photoFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length < files.length) {
      setError(`Можно загрузить максимум ${maxPhotos} фотографий`);
    }

    setPhotoFiles((prev) => [...prev, ...filesToAdd]);

    const newPreviews = await Promise.all(
      filesToAdd.map((file) => fileToBase64(file))
    );
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const existingPhotosCount = photos.length;
    if (index < existingPhotosCount) {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingPhotosCount;
      setPhotoFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      setPhotoPreviews((prev) => {
        const existingPreviews = prev.slice(0, existingPhotosCount);
        const newPreviews = prev.slice(existingPhotosCount);
        const updatedNewPreviews = newPreviews.filter((_, i) => i !== fileIndex);
        return [...existingPreviews, ...updatedNewPreviews];
      });
    }
  };

  const loadCriteriaSet = async () => {
    const mockCriteriaSets: Record<string, CriteriaSet> = {
      healthy_food: {
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
      alcohol_tobacco: {
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
      health_facilities: {
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
      industrial: {
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
      waste_collection: {
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
      education: {
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
      medical: {
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
    };

    const criteriaSet = mockCriteriaSets[objectType];
    if (criteriaSet) {
      setCriteriaSet(criteriaSet);
    } else {
      setError('Не удалось загрузить критерии оценки');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const criterionRatings: CriterionRating[] = Object.entries(values)
        .filter(([_, value]) => value !== '' && value !== 0)
        .map(([criterionId, value]) => ({
          criterionId,
          value,
        }));

      if (criterionRatings.length === 0) {
        setError('Пожалуйста, заполните хотя бы один критерий');
        setIsLoading(false);
      return;
    }

      const newPhotoUrls = await Promise.all(
        photoFiles.map((file) => fileToBase64(file))
      );

      const allPhotos = [...photos, ...newPhotoUrls];

      await new Promise((resolve) => setTimeout(resolve, 500));
      

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось сохранить оценку';
      if (errorMessage.includes('авторизац')) {
        setShowAuthModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (criterionId: string, value: number | string) => {
    setValues((prev) => ({ ...prev, [criterionId]: value }));
  };

  if (!criteriaSet) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Загрузка критериев...</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <CriteriaSelector
          criteriaSet={criteriaSet}
          values={values}
          onChange={handleChange}
        />

        <div className="space-y-1">
          <label htmlFor="comment" className="block text-[10px] font-medium">
            Комментарий (необязательно)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-2 py-1 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-[10px]"
            placeholder="Добавьте свой отзыв..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-medium">
            Фотографии (необязательно, максимум 5)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
            id="photo-upload"
            disabled={photos.length + photoFiles.length >= 5}
          />
          <label
            htmlFor="photo-upload"
            className={`flex items-center justify-center gap-2 px-2 py-1.5 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors text-[10px] ${
              photos.length + photoFiles.length >= 5
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <PhotoIcon className="w-4 h-4" />
            <span>Добавить фото</span>
          </label>

          {photoPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Превью ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-[10px] text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-2 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
          >
            {isLoading ? 'Сохранение...' : isEditMode ? 'Обновить отзыв' : 'Сохранить оценку'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1.5 border border-border rounded-lg font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary text-[10px]"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </>
  );
}



