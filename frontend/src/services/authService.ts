import { apiClient } from '@/lib/api';
import { removeAuthToken } from '@/lib/tokenStorage';

export const authService = {
  async getCurrentUser() {
    try {
      const response = await apiClient.getCurrentUser();
      // Проверяем, есть ли флаг unauthorized (это означает, что пользователь не авторизован)
      if (response && 'unauthorized' in response && response.unauthorized) {
        return null;
      }
      return response;
    } catch (error) {
      // Если произошла ошибка, возвращаем null
      return null;
    }
  },

  async getUser(id: string) {
    return apiClient.getUser(id);
  },

  async logout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    // Удаляем токен из localStorage при выходе
    removeAuthToken();

    if (!response.ok) {
      throw new Error('Ошибка выхода');
    }

    return response.json();
  },

  /**
   * Инициирует OAuth авторизацию через Яндекс
   * Отправляет POST запрос на /api/auth/yandex
   * Возвращает URL для редиректа на Яндекс OAuth
   */
  async initiateYandexAuth(): Promise<string> {
    const response = await fetch('/api/auth/yandex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Ошибка при инициации авторизации');
    }

    const data = await response.json();
    const authUrl = data.data?.authUrl;

    if (!authUrl) {
      throw new Error('URL для авторизации не получен');
    }

    return authUrl;
  },
};






