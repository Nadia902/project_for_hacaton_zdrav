'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ratingService } from '@/services/ratingService';
import { RatingForm } from '@/components/Rating/RatingForm';
import { useUserStore } from '@/store/userStore';
import type { InfrastructureObject, Rating } from '@/types';
import { formatDate, formatRating, getObjectTypeName, canEditRating, getRemainingEditTime } from '@/lib/utils';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ObjectPopupProps {
  object: InfrastructureObject;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: [number, number];
  zoom: number;
}

// Функция для конвертации lat/lng в пиксели
function latLngToPixel(
  lat: number,
  lng: number,
  center: [number, number],
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
) {
  function latLngToTile(lat: number, lng: number, z: number) {
    const n = Math.pow(2, z);
    const tileX = Math.floor((lng + 180) / 360 * n);
    const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x: tileX, y: tileY };
  }

  const centerTile = latLngToTile(center[0], center[1], zoom);
  const pointTile = latLngToTile(lat, lng, zoom);
  const tileSize = 256;
  const pixelX = (pointTile.x - centerTile.x) * tileSize + canvasWidth / 2;
  const pixelY = (pointTile.y - centerTile.y) * tileSize + canvasHeight / 2;
  return { x: pixelX, y: pixelY };
}

export function ObjectPopup({
  object,
  onClose,
  canvasRef,
  containerRef,
  center,
  zoom,
}: ObjectPopupProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const { user } = useUserStore();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const { data: ratings } = useQuery({
    queryKey: ['ratings', object.id],
    queryFn: async () => {
      const response = await ratingService.getRatings(object.id);
      return response.data;
    },
  });

  // Вычисление позиции попапа относительно маркера
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !popupRef.current) return;

    const updatePosition = () => {
      if (!canvasRef.current || !containerRef.current || !popupRef.current) return;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      const popup = popupRef.current;

      const pixel = latLngToPixel(
        object.location.lat,
        object.location.lng,
        center,
        zoom,
        canvas.width,
        canvas.height
      );

      const rect = container.getBoundingClientRect();
      const popupWidth = popup.offsetWidth || 320;
      const popupHeight = popup.offsetHeight;
      
      const margin = 30; // Отступ от маркера
      const minTopMargin = 20; // Минимальный отступ от верха контейнера
      
      // Используем реальную высоту или консервативную оценку
      const estimatedHeight = popupHeight > 0 ? popupHeight : 250;

      // Позиционируем попап над маркером (сверху) по умолчанию
      let left = pixel.x - popupWidth / 2;
      let top = pixel.y - estimatedHeight - margin;

      // Корректируем горизонтальную позицию, если попап выходит за границы
      if (left < 10) left = 10;
      if (left + popupWidth > rect.width - 10) left = rect.width - popupWidth - 10;
      
      // Показываем снизу только если действительно не помещается сверху
      // Проверяем, достаточно ли места сверху от маркера
      const spaceAbove = pixel.y - minTopMargin;
      const requiredSpace = estimatedHeight + margin;
      
      if (spaceAbove < requiredSpace && pixel.y < rect.height / 3) {
        // Недостаточно места сверху и маркер в верхней трети экрана - показываем снизу
        top = pixel.y + margin;
      } else if (top < minTopMargin) {
        // Если popup выходит за верхнюю границу, но есть место - корректируем
        top = minTopMargin;
      }

      setPosition({ top, left });
    };

    // Обновляем позицию сразу и после небольшой задержки (когда попап отрендерится)
    updatePosition();
    const timeoutId = setTimeout(updatePosition, 50);

    // Обновляем позицию при изменении размера окна
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
    };
  }, [canvasRef, containerRef, object, center, zoom]);

  return (
    <div
      ref={popupRef}
      data-popup
      className="absolute z-20 bg-background border border-border rounded-lg shadow-2xl w-80 max-h-[600px] flex flex-col"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{object.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {getObjectTypeName(object.type)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-accent rounded transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {object.location.address && (
          <div className="text-sm text-muted-foreground">
            📍 {object.location.address}
          </div>
        )}

        {object.averageRating !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ⭐ {formatRating(object.averageRating)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({object.ratingsCount} {object.ratingsCount === 1 ? 'оценка' : 'оценок'})
            </span>
          </div>
        )}

        {object.description && (
          <p className="text-sm">{object.description}</p>
        )}

        {/* Отзывы */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Отзывы</h4>
            <button
              onClick={() => setShowRatingForm(!showRatingForm)}
              className="text-xs px-3 py-1 bg-foreground text-background rounded hover:opacity-90 transition-opacity"
            >
              {showRatingForm ? 'Отмена' : '+ Отзыв'}
            </button>
          </div>

          {showRatingForm && (
            <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
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
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {ratings.map((rating: Rating) => {
                const isUserRating = user?.id === rating.userId;
                const canEdit = isUserRating && canEditRating(rating.createdAt);
                const remainingTime = canEdit ? getRemainingEditTime(rating.createdAt) : 0;

                return (
                  <div
                    key={rating.id}
                    className="p-3 bg-muted rounded-lg border border-border text-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground">
                          Пользователь #{rating.userId.slice(0, 8)}
                        </span>
                        {canEdit && (
                          <span className="ml-2 text-xs text-primary">
                            (можно редактировать еще {remainingTime} мин.)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(rating.createdAt)}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingRating(rating);
                              setShowRatingForm(true);
                            }}
                            className="p-1 hover:bg-accent rounded transition-colors"
                            title="Редактировать отзыв"
                          >
                            <PencilIcon className="w-3.5 h-3.5 text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-sm">{rating.comment}</p>
                    )}
                    {rating.photos && rating.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {rating.photos.map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo}
                            alt={`Фото ${photoIndex + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-border/50"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пока нет отзывов. Будьте первым!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

