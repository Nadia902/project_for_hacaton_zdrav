'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaYandex } from 'react-icons/fa';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleYandexAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Отправляем POST запрос на /api/auth/yandex
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

      // Перенаправляем на URL, полученный от бекенда
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <h2 className="text-xl font-bold text-foreground">
                  Вход
                </h2>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                  aria-label="Закрыть"
                >
                  <XMarkIcon className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Войдите через Яндекс, чтобы добавлять отзывы и объекты
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleYandexAuth}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#FC3F1D] text-white rounded-lg font-semibold hover:bg-[#FC3F1D]/90 focus:outline-none focus:ring-2 focus:ring-[#FC3F1D] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Перенаправление...</span>
                      </>
                    ) : (
                      <>
                        <FaYandex className="w-5 h-5" />
                        <span>Войти через Яндекс</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    Нажимая кнопку, вы соглашаетесь с условиями использования
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

