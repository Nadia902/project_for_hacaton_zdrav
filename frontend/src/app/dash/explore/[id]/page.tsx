'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mapService } from '@/services/mapService';
import { ratingService } from '@/services/ratingService';
import { RatingForm } from '@/components/Rating/RatingForm';
import { useUserStore } from '@/store/userStore';
import { formatDate, formatRating, getObjectTypeName, canEditRating, getRemainingEditTime } from '@/lib/utils';
import type { Rating } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon, MapPinIcon, StarIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function ObjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const { user } = useUserStore();
  const isMobile = useIsMobile();

  const { data: object, isLoading } = useQuery({
    queryKey: ['object', id],
    queryFn: async () => {
      const response = await mapService.getObject(id);
      return response.data;
    },
  });

  const { data: ratings } = useQuery({
    queryKey: ['ratings', id],
    queryFn: async () => {
      const response = await ratingService.getRatings(id);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Объект не найден</h1>
          <Link
            href="/map"
            className="text-foreground hover:underline"
          >
            Вернуться к карте
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-background">
        <Link
          href="/map"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Назад к карте
        </Link>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold break-words">{object.name}</h1>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base text-muted-foreground">{getObjectTypeName(object.type)}</p>
              {object.location.address && (
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground flex items-start gap-1 break-words">
                  <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <span>{object.location.address}</span>
                </p>
              )}
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              {object.averageRating !== undefined && (
                <div className="text-xl sm:text-2xl font-bold flex items-center gap-1 sm:justify-end">
                  <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" />
                  {formatRating(object.averageRating)}
                </div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground">
                {object.ratingsCount} {object.ratingsCount === 1 ? 'оценка' : 'оценок'}
              </p>
            </div>
          </div>

          {object.description && (
            <div className="p-3 sm:p-4 bg-muted rounded-lg border border-border">
              <p className="text-xs sm:text-sm break-words">{object.description}</p>
            </div>
          )}

          {object.healthIndex !== undefined && (
            <div className="p-3 sm:p-4 bg-muted rounded-lg border border-border">
              <h3 className="text-xs sm:text-sm font-semibold mb-2">Индекс здоровья</h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground transition-all"
                      style={{ width: `${object.healthIndex}%` }}
                    />
                  </div>
                </div>
                <span className="text-base sm:text-lg font-bold">{object.healthIndex}</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Оценки</h2>
              <button
                onClick={() => setShowRatingForm(!showRatingForm)}
                className="px-3 sm:px-4 py-2 bg-foreground text-background rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
              >
                {showRatingForm ? 'Отмена' : 'Добавить оценку'}
              </button>
            </div>

            {showRatingForm && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-muted rounded-lg border border-border">
                <RatingForm
                  objectId={object.id}
                  objectType={object.type}
                  onSuccess={() => {
                    setShowRatingForm(false);
                    setEditingRating(null);
                  }}
                  onCancel={() => {
                    setShowRatingForm(false);
                    setEditingRating(null);
                  }}
                  initialRating={editingRating ? {
                    id: editingRating.id,
                    criterionRatings: editingRating.criterionRatings,
                    comment: editingRating.comment,
                    photos: editingRating.photos,
                  } : undefined}
                  isEditMode={!!editingRating}
                />
              </div>
            )}

            {ratings && ratings.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {ratings.map((rating: Rating) => {
                  const isUserRating = user?.id === rating.userId;
                  const canEdit = isUserRating && canEditRating(rating.createdAt);
                  const remainingTime = canEdit ? getRemainingEditTime(rating.createdAt) : 0;

                  return (
                    <div
                      key={rating.id}
                      className="p-3 sm:p-4 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium break-words">
                            Пользователь #{rating.userId.slice(0, 8)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(rating.createdAt)}
                            </p>
                            {canEdit && (
                              <span className="text-xs text-primary whitespace-nowrap">
                                (можно редактировать еще {remainingTime} мин.)
                              </span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingRating(rating);
                              setShowRatingForm(true);
                            }}
                            className="p-1.5 sm:p-2 hover:bg-accent rounded transition-colors flex-shrink-0"
                            title="Редактировать отзыв"
                          >
                            <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </button>
                        )}
                      </div>
                      {rating.comment && (
                        <p className="mt-2 text-xs sm:text-sm break-words">{rating.comment}</p>
                      )}
                      {rating.photos && rating.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rating.photos.map((photo, photoIndex) => (
                            <img
                              key={photoIndex}
                              src={photo}
                              alt={`Фото ${photoIndex + 1}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-border/50"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center bg-muted rounded-lg border border-border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Пока нет оценок. Будьте первым!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



