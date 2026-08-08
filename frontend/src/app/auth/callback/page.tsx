'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/authService';
import { setAuthToken, getAuthToken } from '@/lib/tokenStorage';
import { motion } from 'framer-motion';
import { NavBar } from '@/components/Layout/NavBar';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Обработка авторизации...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const encodedData = searchParams.get('data');
        
        if (!encodedData) {
          setError('Данные авторизации не получены');
          setIsLoading(false);
          return;
        }

        let data: { code?: string; state?: string | null; error?: string };
        try {
          const base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const decoded = decodeURIComponent(
            atob(padded)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          data = JSON.parse(decoded);
        } catch (decodeError) {
          console.error('Ошибка декодирования данных:', decodeError);
          setError('Ошибка декодирования данных авторизации');
          setIsLoading(false);
          return;
        }

        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }

        if (!data.code) {
          setError('Код авторизации не найден');
          setIsLoading(false);
          return;
        }

        setStatus('Обмен кода на токен...');

        const response = await fetch(
          `/api/auth/process?code=${encodeURIComponent(data.code)}${data.state ? `&state=${encodeURIComponent(data.state)}` : ''}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Ошибка при обработке авторизации');
        }

        const result = await response.json();
        
        const token = result.data?.token || result.token;
        const user = result.data?.user || result.user;

        if (!token) {
          throw new Error('Токен не получен от сервера');
        }

        if (!user) {
          throw new Error('Данные пользователя не получены от сервера');
        }

        setStatus('Сохранение данных...');

        setAuthToken(token);
        
        const savedToken = getAuthToken();
        if (!savedToken || savedToken !== token) {
          throw new Error('Не удалось сохранить токен');
        }
        
        setUser(user);

        setStatus('Авторизация успешна!');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const tokenBeforeRedirect = getAuthToken();
        if (!tokenBeforeRedirect) {
          throw new Error('Токен был потерян перед редиректом');
        }
        
        router.push('/');
        router.push('/');
      } catch (err) {
        console.error('Ошибка обработки callback:', err);
        setError(err instanceof Error ? err.message : 'Ошибка обработки авторизации');
      } finally {
        setIsLoading(false);
      }
    };

    processCallback();
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
            <p className="text-muted-foreground">{status}</p>
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
          ) : (
            <div className="bg-muted/50 rounded-lg border border-border p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Авторизация успешна!</h2>
              <p className="text-muted-foreground mb-6">
                Перенаправление на главную страницу...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
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
      <CallbackContent />
    </Suspense>
  );
}

