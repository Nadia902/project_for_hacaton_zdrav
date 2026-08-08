'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

function UserLoader() {
  const { setUser } = useUserStore();

  useEffect(() => {
    const loadUser = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      
      setUser(mockUser);
    };

    loadUser();
  }, [setUser]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      localStorage.setItem('theme', 'light');
    }
    const theme = savedTheme || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserLoader />
      {children}
    </QueryClientProvider>
  );
}



