'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { AuthModal } from '@/components/UI/AuthModal';
import { cn } from '@/lib/utils';
import { 
  MapIcon, 
  PlusIcon, 
  UserIcon,
  HomeIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { TbApi } from 'react-icons/tb';
import { FaPeopleGroup } from 'react-icons/fa6';

const ApiIcon = (props: React.ComponentProps<'svg'>) => <TbApi {...props} />;
const RatingIcon = (props: React.ComponentProps<'svg'>) => <FaPeopleGroup {...props} />;

const navigation = [
  { name: 'Главная', href: '/', icon: HomeIcon },
  { name: 'Карта', href: '/map', icon: MapIcon },
  { name: 'Дашборд', href: '/dash', icon: ChartBarIcon },
  { name: 'Рейтинг', href: '/rating', icon: RatingIcon },
  { name: 'Open API', href: '/api/docs', icon: ApiIcon, openInNewTab: true },
  { name: 'Добавить', href: '/add', icon: PlusIcon },
  { name: 'Профиль', href: '/profile', icon: UserIcon, requiresAuth: true },
];

interface NavBarProps {
  filtersToggle?: {
    isOpen: boolean;
    onToggle: () => void;
  };
}

export function NavBar({ filtersToggle }: NavBarProps = {}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useUserStore();
  const isOnDashPage = pathname === '/dash';

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowAuthModal(true);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="relative top-0 left-0 right-0 h-14 sm:h-16 border-b border-border bg-background z-50">
      <div className="flex items-center justify-between h-full px-3 sm:px-4">
        <Link href="/" className="text-xs sm:text-sm font-semibold">
          Здоровая среда
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname?.startsWith(item.href));
            
            if (item.requiresAuth && !user) {
              return (
                <button
                  key={item.href}
                  onClick={handleProfileClick}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            }
            
            if (item.openInNewTab) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </a>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="md:hidden flex items-center gap-1.5">
          {isOnDashPage && filtersToggle && (
            <button
              onClick={filtersToggle.onToggle}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5",
                filtersToggle.isOpen
                  ? "bg-accent text-foreground shadow-sm"
                  : "bg-muted/50 text-foreground hover:bg-muted border border-border/60"
              )}
              aria-label="Toggle filters"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Фильтры</span>
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50 md:hidden">
            <div className="px-3 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname?.startsWith(item.href));
                
                if (item.requiresAuth && !user) {
                  return (
                    <button
                      key={item.href}
                      onClick={handleProfileClick}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left',
                        isActive
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </button>
                  );
                }
                
                if (item.openInNewTab) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </nav>
  );
}

