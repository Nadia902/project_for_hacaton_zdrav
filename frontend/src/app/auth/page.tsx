'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/authService';
import { setAuthToken, getAuthToken } from '@/lib/tokenStorage';
import { motion } from 'framer-motion';
import { NavBar } from '@/components/Layout/NavBar';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokenProcessedRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (tokenProcessedRef.current) {
        return;
      }

      try {
        const errorParam = searchParams.get('error');
        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setIsLoading(false);
          return;
        }

        const token = searchParams.get('token');
        if (token) {
          tokenProcessedRef.current = true;
          
          try {
            setAuthToken(token);
            
            const savedToken = getAuthToken();
            
            if (!savedToken) {
              setError('Ошибка при сохранении токена');
              setIsLoading(false);
              tokenProcessedRef.current = false;
              return;
            }
            
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete('token');
            const newUrl = newSearchParams.toString() 
              ? `${window.location.pathname}?${newSearchParams.toString()}`
              : window.location.pathname;
            router.replace(newUrl, { scroll: false });
          } catch (storageError) {
            setError('Ошибка при сохранении токена: ' + (storageError instanceof Error ? storageError.message : 'неизвестная ошибка'));
            setIsLoading(false);
            tokenProcessedRef.current = false;
            return;
          }
        }

        const existingToken = getAuthToken();
        
        const response = await authService.getCurrentUser();
        if (response?.data) {
          setUser(response.data);
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          if (existingToken) {
            setError('Токен недействителен или истек');
          } else {
            setError('Не удалось загрузить информацию о пользователе');
          }
        }
      } catch (err) {
        setError('Ошибка при проверке авторизации');
        tokenProcessedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [searchParams, setUser, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Проверка авторизации...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto px-4"
        >
          {error ? (
            <div className="bg-muted/50 rounded-lg border border-border p-6 text-center">
              <XCircleIcon className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Ошибка авторизации</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Вернуться на главную
              </button>
            </div>
          ) : user ? (
            <div className="bg-muted/50 rounded-lg border border-border p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Авторизация успешна!</h2>
              <p className="text-muted-foreground mb-2">
                Добро пожаловать, <span className="font-semibold text-foreground">{user.username}</span>!
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Перенаправление на главную страницу...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg border border-border p-6 text-center">
              <XCircleIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Не авторизован</h2>
              <p className="text-muted-foreground mb-6">
                Пожалуйста, войдите через Яндекс
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Вернуться на главную
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex flex-col bg-background">
          <NavBar />
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка...</p>
            </motion.div>
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

