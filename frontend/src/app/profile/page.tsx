'use client';

import { useState, useMemo } from 'react';
import { useUserStore } from '@/store/userStore';
import { AuthModal } from '@/components/UI/AuthModal';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Rating } from '@/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NavBar } from '@/components/Layout/NavBar';
import {
  TrophyIcon,
  ChartBarIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  InboxIcon,
  MapIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const mockUser = {
  id: '1',
  username: 'Тестовый пользователь',
  email: 'test@example.com',
  avatar: undefined,
  points: 750,
  badges: ['Первопроходец', 'Активный участник', 'Эксперт по здоровью'],
  level: 'Эксперт',
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockRatings: Rating[] = [
  {
    id: 'rating-1',
    objectId: '123',
    userId: '1',
    criterionRatings: [
      { criterionId: 'product_quality', value: 5 },
      { criterionId: 'service_quality', value: 4 },
      { criterionId: 'cleanliness', value: 5 },
    ],
    comment: 'Отличное место! Очень чисто и уютно. Персонал вежливый, обслуживание на высшем уровне.',
    photos: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rating-2',
    objectId: '456',
    userId: '1',
    criterionRatings: [
      { criterionId: 'accessibility', value: 4 },
      { criterionId: 'safety', value: 5 },
      { criterionId: 'environment', value: 4 },
    ],
    comment: 'Отличное место! Всё на высоте, рекомендую всем посетить это место.',
    photos: [],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rating-3',
    objectId: '789',
    userId: '1',
    criterionRatings: [
      { criterionId: 'product_quality', value: 3 },
      { criterionId: 'price', value: 4 },
      { criterionId: 'location', value: 5 },
    ],
    comment: 'Неплохо, но есть куда расти. Расположение удобное, цены приемлемые.',
    photos: [],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rating-4',
    objectId: '101',
    userId: '1',
    criterionRatings: [
      { criterionId: 'service_quality', value: 5 },
      { criterionId: 'cleanliness', value: 5 },
      { criterionId: 'atmosphere', value: 5 },
    ],
    comment: 'Превосходное обслуживание! Чистота идеальная, атмосфера приятная. Обязательно вернусь!',
    photos: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rating-5',
    objectId: '202',
    userId: '1',
    criterionRatings: [
      { criterionId: 'accessibility', value: 3 },
      { criterionId: 'safety', value: 4 },
      { criterionId: 'environment', value: 4 },
    ],
    comment: 'Хорошее место, но нужно улучшить доступность для людей с ограниченными возможностями.',
    photos: [],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ProfilePage() {
  const { user, setUser } = useUserStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const userData = useMemo(() => {
    if (user) {
      return user;
    }
    setUser(mockUser);
    return mockUser;
  }, [user, setUser]);

  const ratings = useMemo(() => {
    if (!userData?.id) return [];
    return mockRatings;
  }, [userData]);

  const calculateLevel = (points: number = 0) => {
    if (points < 100) return { level: 'Новичок', progress: (points / 100) * 100, next: 100 };
    if (points < 500) return { level: 'Активист', progress: ((points - 100) / 400) * 100, next: 500 };
    if (points < 1000) return { level: 'Эксперт', progress: ((points - 500) / 500) * 100, next: 1000 };
    if (points < 2500) return { level: 'Мастер', progress: ((points - 1000) / 1500) * 100, next: 2500 };
    return { level: 'Легенда', progress: 100, next: null };
  };

  const levelInfo = calculateLevel(userData?.points);

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-6"
          >
            <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Профиль</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ваша активность и достижения на платформе
            </p>
          </motion.div>

          {userData ? (
            <div className="space-y-4 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-muted/50 rounded-lg border border-border p-4 sm:p-6"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
                  <div className="relative">
                    {userData.avatar ? (
                      <img
                        src={userData.avatar}
                        alt={userData.username}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-2 border-border object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-foreground text-background flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 border-border">
                        {userData.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-background"></div>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h2 className="text-lg sm:text-2xl font-bold">{userData.username}</h2>
                      {userData.level && (
                        <span className="px-2 sm:px-3 py-1 bg-muted text-foreground rounded-full text-xs font-semibold border border-border w-fit">
                          {userData.level}
                        </span>
                      )}
                    </div>
                    
                    {userData.points !== undefined && (
                      <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                            Уровень: <span className="text-foreground normal-case">{levelInfo.level}</span>
                          </span>
                          <span className="text-xs sm:text-sm font-semibold">
                            {userData.points} <span className="text-muted-foreground font-normal">баллов</span>
                          </span>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(levelInfo.progress, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="absolute inset-y-0 left-0 bg-foreground rounded-full"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {levelInfo.next ? `До следующего уровня: ${levelInfo.next - (userData.points || 0)} баллов` : 'Максимальный уровень!'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {userData.badges && userData.badges.length > 0 && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 sm:mb-3 flex items-center gap-2">
                      <TrophyIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Достижения
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {userData.badges.map((badge, index) => (
                        <motion.span
                          key={badge}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-background text-foreground rounded-lg text-xs font-medium border border-border hover:border-foreground/50 transition-all duration-200"
                        >
                          {badge}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-muted/50 rounded-lg border border-border p-3 sm:p-4"
                >
                  <div className="text-xs text-muted-foreground uppercase mb-1">Оценок оставлено</div>
                  <div className="flex items-center justify-between">
                    <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <div className="text-xl sm:text-2xl font-bold">{ratings?.length || 0}</div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-muted/50 rounded-lg border border-border p-3 sm:p-4"
                >
                  <div className="text-xs text-muted-foreground uppercase mb-1">Средняя оценка</div>
                  <div className="flex items-center justify-between">
                    <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <div className="text-xl sm:text-2xl font-bold">
                      {ratings && ratings.length > 0
                        ? (ratings.reduce((acc: number, r: Rating) => {
                            const avg = r.criterionRatings.reduce((sum: number, cr) => {
                              const val = typeof cr.value === 'number' ? cr.value : parseFloat(cr.value) || 0;
                              return sum + val;
                            }, 0) / r.criterionRatings.length;
                            return acc + avg;
                          }, 0) / ratings.length).toFixed(1)
                        : '0.0'}
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-muted/50 rounded-lg border border-border p-3 sm:p-4"
                >
                  <div className="text-xs text-muted-foreground uppercase mb-1">Баллов активности</div>
                  <div className="flex items-center justify-between">
                    <AdjustmentsHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <div className="text-xl sm:text-2xl font-bold">{userData.points || 0}</div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-background rounded-lg border border-border p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Мои оценки
                  </h2>
                  {ratings && ratings.length > 0 && (
                    <span className="text-xs text-muted-foreground uppercase">
                      Всего: {ratings.length}
                    </span>
                  )}
                </div>
                
                {ratings && ratings.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {ratings.map((rating: Rating, index: number) => {
                      const avgRating = rating.criterionRatings.reduce((sum: number, cr) => {
                        const val = typeof cr.value === 'number' ? cr.value : parseFloat(cr.value) || 0;
                        return sum + val;
                      }, 0) / rating.criterionRatings.length;

                      return (
                        <motion.div
                          key={rating.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                        >
                          <Link
                            href={`/dash/explore/${rating.objectId}`}
                            className="block p-3 sm:p-4 bg-muted/50 rounded-lg border border-border hover:border-foreground/50 hover:bg-muted transition-all duration-200 group"
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <div className="px-2 py-1 bg-background rounded text-xs font-semibold border border-border w-fit">
                                    Объект #{rating.objectId.slice(0, 8)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                          i < Math.round(avgRating)
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-muted-foreground/30'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-semibold">
                                      {avgRating.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                                
                                {rating.comment && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 group-hover:text-foreground transition-colors">
                                    {rating.comment}
                                  </p>
                                )}
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {formatDateTime(rating.createdAt)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ClipboardDocumentListIcon className="w-3 h-3" />
                                    {rating.criterionRatings.length} критериев
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-foreground/30 group-hover:text-foreground transition-colors flex-shrink-0">
                                <ArrowRightIcon className="w-4 h-4" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 sm:p-12 text-center bg-muted/30 rounded-lg border-2 border-dashed border-border"
                  >
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <InboxIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold mb-2">Пока нет оценок</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                      Начните оценивать объекты на карте, чтобы помочь другим пользователям узнать о качестве инфраструктуры
                    </p>
                    <Link
                      href="/map"
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-foreground text-background rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-all duration-200"
                    >
                      <MapIcon className="w-4 h-4" />
                      Начать оценивать
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto text-center py-8 sm:py-16"
            >
              <div className="bg-muted/50 p-6 sm:p-12 rounded-lg border border-border">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <LockClosedIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Войдите в систему</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
                  Для доступа к профилю и отслеживанию вашей активности необходимо войти в систему
                </p>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-foreground text-background rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-all duration-200"
                >
                  Войти
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}

