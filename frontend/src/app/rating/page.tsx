'use client';

import { useState, useEffect } from 'react';
import { NavBar } from '@/components/Layout/NavBar';
import { apiClient } from '@/lib/api';
import { getYandexAvatarUrl } from '@/lib/utils';

interface MunicipalityRating {
  mo: string;
  health_index: number;
  total_ratings: number;
  population: number;
  ratings_per_1000: number;
}

interface UserRating {
  login: string;
  avatar_url: string;
  points: number;
  lvl: string;
}

export default function RatingPage() {
  const [municipalityRatings, setMunicipalityRatings] = useState<MunicipalityRating[]>([]);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Загружаем рейтинг муниципалитетов
        const municipalityResponse = await apiClient.getMunicipalityHealthIndex();
        if (municipalityResponse.data) {
          setMunicipalityRatings(municipalityResponse.data);
        }

        // Загружаем рейтинг пользователей
        const usersResponse = await apiClient.getTopUsers(10);
        if (usersResponse.data) {
          setUserRatings(usersResponse.data);
        }
      } catch (err) {
        console.error('Ошибка загрузки рейтингов:', err);
        setError('Не удалось загрузить рейтинги. Попробуйте обновить страницу.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavBar />
        <div className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto"></div>
            <p className="mt-6 text-sm text-muted-foreground font-medium">
              Загрузка рейтингов...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl">
          {/* Заголовок */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">
              Рейтинг
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Рейтинг муниципалитетов и пользователей по активности
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Рейтинги в grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Рейтинг муниципалитетов */}
            <div className="flex flex-col bg-muted/50 rounded-lg border border-border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Рейтинг муниципалитетов
              </h2>
              
              {municipalityRatings.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">Нет данных</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 font-semibold text-foreground">Место</th>
                        <th className="text-left py-3 px-3 font-semibold text-foreground">Муниципалитет</th>
                        <th className="text-right py-3 px-3 font-semibold text-foreground">ИЗМО</th>
                        <th className="text-right py-3 px-3 font-semibold text-foreground">Оценок</th>
                        <th className="text-right py-3 px-3 font-semibold text-foreground">На 1000 чел.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {municipalityRatings.map((municipality, index) => (
                        <tr
                          key={municipality.mo}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {index < 3 ? (
                                <span className="text-lg">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm font-medium text-foreground">{municipality.mo}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm font-semibold text-foreground">
                              {municipality.health_index.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm text-foreground">
                              {municipality.total_ratings}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm text-muted-foreground">
                              {municipality.ratings_per_1000.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Рейтинг пользователей */}
            <div className="flex flex-col bg-muted/50 rounded-lg border border-border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Рейтинг пользователей
              </h2>
              
              {userRatings.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">Нет данных</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 font-semibold text-foreground">Место</th>
                        <th className="text-left py-3 px-3 font-semibold text-foreground">Пользователь</th>
                        <th className="text-right py-3 px-3 font-semibold text-foreground">Баллы</th>
                        <th className="text-right py-3 px-3 font-semibold text-foreground">Уровень</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRatings.map((user, index) => {
                        const avatarUrl = getYandexAvatarUrl(user.avatar_url);
                        return (
                          <tr
                            key={user.login}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                {index < 3 ? (
                                  <span className="text-lg">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-muted-foreground">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2 min-w-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={user.login}
                                    className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0"
                                    onError={(e) => {
                                      // Если аватар не загрузился, скрываем его
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold border border-border flex-shrink-0">
                                    {user.login.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-foreground truncate">{user.login}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-sm font-semibold text-foreground">{user.points}</span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-sm text-muted-foreground">{user.lvl}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
