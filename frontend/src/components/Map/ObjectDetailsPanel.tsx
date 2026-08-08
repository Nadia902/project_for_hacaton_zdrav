'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ratingService } from '@/services/ratingService';
import { RatingModal } from './RatingModal';
import { AuthModal } from '@/components/UI/AuthModal';
import { useUserStore } from '@/store/userStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { InfrastructureObject, Rating, ObjectDetails } from '@/types';
import { formatDate, formatRating, getObjectTypeName, getCriterionName, canEditRating, getRemainingEditTime } from '@/lib/utils';
import { getMarkerIconComponent } from '@/lib/map';
import { XMarkIcon, StarIcon, MapPinIcon, ExclamationTriangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { mapService } from '@/services/mapService';

interface ObjectDetailsPanelProps {
  object: InfrastructureObject;
  onClose: () => void;
}

// URL для интеграции с "Открытый регион 71"
const OPEN_REGION_71_URL = 'https://or71.ru/solve/add/zdravookhranenie/';

export function ObjectDetailsPanel({ object, onClose }: ObjectDetailsPanelProps) {
  const isMobile = useIsMobile();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const { user } = useUserStore();

  // Загрузка детальной информации об объекте
  const { data: objectDetails, isLoading } = useQuery<ObjectDetails>({
    queryKey: ['object-details', object.id],
    queryFn: async () => {
      const response = await mapService.getObject(object.id);
      return response.data;
    },
  });

  // Загрузка отзывов
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: ['ratings', object.id],
    queryFn: async () => {
      const response = await ratingService.getRatings(object.id);
      return response.data;
    },
  });

  // Загрузка оценок текущего пользователя для этого объекта
  const { data: userRatings } = useQuery<Rating[]>({
    queryKey: ['user-ratings', object.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await ratingService.getRatings(object.id, user.id);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const handleComplain = () => {
    // Открываем страницу "Открытый регион 71" в новой вкладке
    window.open(OPEN_REGION_71_URL, '_blank', 'noopener,noreferrer');
  };

  // Проверяем, есть ли у пользователя оценки ниже 3
  const shouldShowComplainButton = useMemo(() => {
    if (!userRatings || userRatings.length === 0) return false;
    
    // Проверяем все оценки пользователя по критериям
    return userRatings.some((rating) => {
      return rating.criterionRatings.some((cr) => {
        const value = typeof cr.value === 'number' ? cr.value : parseFloat(cr.value);
        return !isNaN(value) && value < 3;
      });
    });
  }, [userRatings]);
  
  // Обновляем данные после успешной оценки
  const handleRatingSuccess = () => {
    // Данные обновятся автоматически через react-query
  };

  // Вычисляем средние оценки по критериям
  const averageCriterionRatings = objectDetails?.averageCriterionRatings || {};

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`absolute top-0 right-0 h-full w-full ${isMobile ? '' : 'md:w-96'} bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl z-40 flex flex-col overflow-hidden`}
    >
      {/* Декоративный градиент сверху */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      
      {/* Заголовок */}
      <div className="p-4 border-b border-border/50 flex items-start justify-between flex-shrink-0 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="flex-1 pr-3 min-w-0">
          <h3 className="font-bold text-base truncate text-foreground">{object.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            {(() => {
              const IconComponent = getMarkerIconComponent(object.type);
              return <IconComponent className="w-4 h-4" />;
            })()}
            {getObjectTypeName(object.type)}
          </p>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-accent/50 rounded-lg transition-colors flex-shrink-0 group"
          aria-label="Закрыть"
        >
          <XMarkIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </motion.button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="rounded-full h-10 w-10 border-3 border-primary/20 border-t-primary"
            />
          </div>
        ) : (
          <>
            {/* Адрес */}
            {object.location.address && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-muted/50 rounded-xl border border-border/50"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  Адрес
                </h4>
                <p className="text-sm font-medium">{object.location.address}</p>
              </motion.div>
            )}

            {/* Общий рейтинг */}
            {object.averageRating !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-primary" />
                  Общий рейтинг
                </h4>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground flex items-center gap-1">
                    <StarIcon className="w-6 h-6 fill-primary text-primary" />
                    {formatRating(object.averageRating)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({object.ratingsCount} {object.ratingsCount === 1 ? 'оценка' : 'оценок'})
                  </span>
                </div>
              </motion.div>
            )}

            {/* Индекс здоровья */}
            {object.healthIndex !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-muted/50 rounded-xl border border-border/50"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                  Индекс здоровья
                </h4>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold">{object.healthIndex.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden shadow-inner border-2 border-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${object.healthIndex}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full shadow-sm"
                    style={{ 
                      minWidth: '2px',
                      background: object.healthIndex >= 70 
                        ? 'linear-gradient(to right, #22c55e, #16a34a)' 
                        : object.healthIndex >= 50
                        ? 'linear-gradient(to right, #eab308, #ca8a04)'
                        : 'linear-gradient(to right, #ef4444, #dc2626)'
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Оценки по критериям */}
            {Object.keys(averageCriterionRatings).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-muted/50 rounded-xl border border-border/50"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                  Оценки по критериям
                </h4>
                <div className="space-y-3">
                  {Object.entries(averageCriterionRatings).map(([criterionId, rating], index) => (
                    <motion.div
                      key={criterionId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{getCriterionName(criterionId)}</span>
                        <span className="text-xs font-bold">{formatRating(rating)}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(rating / 5) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + index * 0.05, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Описание */}
            {object.description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-3 bg-muted/50 rounded-xl border border-border/50"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Описание
                </h4>
                <p className="text-sm leading-relaxed">{object.description}</p>
              </motion.div>
            )}


            {/* Фотографии */}
            {objectDetails?.photos && objectDetails.photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                  Фотографии
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {objectDetails.photos.map((photo, index) => (
                    <motion.img
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      src={photo}
                      alt={`${object.name} - фото ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-border/50 shadow-md cursor-pointer"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Кнопки действий */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2 pt-4 border-t border-border/50"
            >
              <motion.button
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else {
                    setShowRatingModal(true);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
              >
                <StarIcon className="w-5 h-5" />
                Оценить этот объект
              </motion.button>

              {shouldShowComplainButton && (
                <motion.button
                  onClick={handleComplain}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 bg-destructive/90 text-destructive-foreground rounded-xl font-semibold hover:bg-destructive transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Пожаловаться
                </motion.button>
              )}
            </motion.div>

            {/* Отзывы */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-4 border-t border-border/50"
            >
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <span>Отзывы</span>
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                  {ratings?.length || 0}
                </span>
              </h4>
              {ratings && ratings.length > 0 ? (
                <div className="space-y-3">
                  {ratings.slice(0, 5).map((rating: Rating, index) => {
                    const isUserRating = user?.id === rating.userId;
                    const canEdit = isUserRating && canEditRating(rating.createdAt);
                    const remainingTime = canEdit ? getRemainingEditTime(rating.createdAt) : 0;

                    return (
                      <motion.div
                        key={rating.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="p-3 bg-muted/50 rounded-xl border border-border/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <span className="text-xs text-muted-foreground font-medium">
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
                              <motion.button
                                onClick={() => {
                                  setEditingRating(rating);
                                  setShowRatingModal(true);
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1 hover:bg-accent rounded transition-colors"
                                title="Редактировать отзыв"
                              >
                                <PencilIcon className="w-3.5 h-3.5 text-primary" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-sm mb-2 leading-relaxed">{rating.comment}</p>
                        )}
                        {rating.photos && rating.photos.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {rating.photos.map((photo, photoIndex) => (
                              <motion.img
                                key={photoIndex}
                                whileHover={{ scale: 1.1 }}
                                src={photo}
                                alt={`Фото ${photoIndex + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-border/50 shadow-sm cursor-pointer"
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {ratings.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Показано 5 из {ratings.length} отзывов
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Пока нет отзывов. Будьте первым!
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
      
      {/* Модальное окно для оценки */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setEditingRating(null);
        }}
        objectId={object.id}
        objectType={object.type}
        objectName={object.name}
        onSuccess={() => {
          handleRatingSuccess();
          setEditingRating(null);
        }}
        initialRating={editingRating || undefined}
        isEditMode={!!editingRating}
      />

      {/* Модальное окно авторизации */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setShowRatingModal(true);
        }}
      />
    </motion.div>
  );
}

