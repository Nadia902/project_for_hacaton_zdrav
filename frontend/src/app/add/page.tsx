'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mapService } from '@/services/mapService';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useUserStore } from '@/store/userStore';
import { AuthModal } from '@/components/UI/AuthModal';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/map';
import type { ObjectType } from '@/types';
import { getObjectTypeName } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { NavBar } from '@/components/Layout/NavBar';
import {
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { IoSchoolOutline, IoFitnessOutline } from 'react-icons/io5';
import { PiTree } from 'react-icons/pi';
import { FaRegHospital } from 'react-icons/fa';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { FaIndustry } from 'react-icons/fa';
import { GiHealthNormal } from 'react-icons/gi';

const DynamicLeafletMap = dynamic(() => import('@/components/Map/LeafletMap').then(mod => ({ default: mod.LeafletMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
      <div className="text-center animate-fade-in">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto"></div>
        <p className="mt-6 text-sm text-muted-foreground font-medium">Загрузка карты...</p>
      </div>
    </div>
  ),
});

const objectTypes: ObjectType[] = [
  'healthy_food',
  'alcohol_tobacco',
  'health_facilities',
  'industrial',
  'waste_collection',
  'education',
  'medical',
];

const TypeIcon = ({ type }: { type: ObjectType }) => {
  const iconClass = "w-8 h-8";
  switch (type) {
    case 'healthy_food':
      return <GiHealthNormal className={iconClass} />;
    case 'alcohol_tobacco':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'health_facilities':
      return <IoFitnessOutline className={iconClass} />;
    case 'industrial':
      return <FaIndustry className={iconClass} />;
    case 'waste_collection':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'education':
      return <IoSchoolOutline className={iconClass} />;
    case 'medical':
      return <FaRegHospital className={iconClass} />;
    default:
      return <MapPinIcon className={iconClass} />;
  }
};

export default function AddObjectPage() {
  const router = useRouter();
  const { location, getLocation, isLoading: isLocationLoading, error: locationError } = useUserLocation();
  const { user } = useUserStore();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'healthy_food' as ObjectType,
    description: '',
    address: '',
  });
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const totalSteps = 3;

  useEffect(() => {
    setMounted(true);
    if (!isMobile) {
      setIsPanelOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isPanelOpen && isMobile && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPanelOpen, isMobile, mounted]);

  useEffect(() => {
    if (location && currentStep === 1) {
      setPosition([location.lat, location.lng]);
      setMapCenter([location.lat, location.lng]);
      setMapZoom(15);
    }
  }, [location, currentStep]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (currentStep === 1) {
      setPosition([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(15);
    }
  }, [currentStep]);

  useEffect(() => {
    if (position) {
      setMapCenter(position);
      setMapZoom(15);
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await mapService.createObject({
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        location: {
          lat: position![0],
          lng: position![1],
          address: formData.address || undefined,
        },
      });

      if (response.data) {
        router.push(`/dash/explore/${response.data.id}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось создать объект';
      if (errorMessage.includes('авторизац')) {
        setShowAuthModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToStep2 = position !== null;
  const canProceedToStep3 = canProceedToStep2 && formData.name.trim() !== '' && formData.type;

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <NavBar />
      
      <div className="flex-1 relative overflow-hidden z-0">
        <DynamicLeafletMap
          objects={[]}
          center={mapCenter}
          zoom={mapZoom}
          onMapClick={handleMapClick}
          showLayerSwitcher={false}
          positionMarker={position}
        />
        
        {currentStep === 1 && (
          <div className="absolute bottom-6 left-6 md:bottom-6 md:left-6 z-20 flex flex-col gap-2">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={getLocation}
              disabled={isLocationLoading}
              className="px-4 py-3 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-lg hover:bg-background transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isLocationLoading ? (
                <>
                  <ClockIcon className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  <span className="font-medium">Определение...</span>
                </>
              ) : (
                <>
                  <MapPinIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium hidden sm:inline">Мое местоположение</span>
                  <span className="font-medium sm:hidden">Мое место</span>
                </>
              )}
            </motion.button>
            {locationError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 max-w-xs"
              >
                {locationError}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {mounted && (
        <AnimatePresence>
          {isPanelOpen && (
            <>
              {isMobile && (
                <motion.div
                  key="overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsPanelOpen(false)}
                  className="fixed inset-0 bg-black/50 z-30 md:hidden"
                />
              )}
              <motion.div
                key={`panel-${isMobile ? 'mobile' : 'desktop'}`}
                initial={isMobile ? { y: '100%' } : false}
                animate={isMobile ? { y: 0 } : { x: 0 }}
                exit={isMobile ? { y: '100%' } : { x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed md:right-0 md:top-14 md:bottom-auto md:h-[calc(100vh-3.5rem)] md:w-full md:max-w-md md:border-l md:rounded-none md:overflow-hidden
                           bottom-0 right-0 top-20 sm:top-24 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] w-full rounded-t-3xl border-t
                           bg-background/95 backdrop-blur-lg border-border shadow-2xl z-30 overflow-y-auto overscroll-contain"
              >
            <div className="flex flex-col h-full md:min-h-0">
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Добавить объект</h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    Поделитесь информацией о новом месте
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0 ml-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-3 sm:pb-4 flex-shrink-0">
                <div className="flex items-center w-full">
                  {[1, 2, 3].map((step, index) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: currentStep >= step ? 1.1 : 1 }}
                          className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 ${
                            currentStep >= step
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {currentStep > step ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5" /> : step}
                        </motion.div>
                      </div>
                      {index < 2 && (
                        <div className="flex-1 mx-1 md:mx-2 min-w-0">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: currentStep > step ? 1 : 0.3 }}
                            className={`h-1 w-full rounded-full transition-all duration-300 ${
                              currentStep > step ? 'bg-foreground' : 'bg-muted'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mt-2">
                  <span className={currentStep === 1 ? 'text-foreground font-medium' : ''}>Местоположение</span>
                  <span className={currentStep === 2 ? 'text-foreground font-medium' : ''}>Основное</span>
                  <span className={currentStep === 3 ? 'text-foreground font-medium' : ''}>Детали</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 md:min-h-0">
                <form id="add-object-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-4">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="bg-muted/50 rounded-lg border border-border p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Местоположение на карте</h2>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Кликните на карте или используйте кнопку "Мое местоположение", чтобы указать точное местоположение объекта</span>
                      </p>
                      {position && (
                        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border border-border">
                          <div className="font-medium mb-1">Выбранные координаты:</div>
                          <div>Широта: {position[0].toFixed(6)}</div>
                          <div>Долгота: {position[1].toFixed(6)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="bg-muted/50 rounded-lg border border-border p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                      <TypeIcon type={formData.type} />
                      Основная информация
                    </h2>
                
                    <div className="space-y-4 sm:space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-foreground">
                          Название объекта <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                          placeholder="Например: Центральный парк культуры и отдыха"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="type" className="block text-xs sm:text-sm font-semibold text-foreground">
                          Тип объекта <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                          {objectTypes.map((type) => (
                            <motion.button
                              key={type}
                              type="button"
                              onClick={() => setFormData({ ...formData, type })}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`p-2 sm:p-4 rounded-lg border transition-all duration-200 ${
                                formData.type === type
                                  ? 'border-foreground bg-foreground/10'
                                  : 'border-border hover:border-foreground/50 bg-background'
                              }`}
                            >
                              <div className="mb-1 sm:mb-2 flex justify-center">
                                <TypeIcon type={type} />
                              </div>
                              <div className="text-[10px] sm:text-xs font-medium leading-tight">{getObjectTypeName(type)}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="bg-muted/50 rounded-lg border border-border p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Дополнительная информация</h2>
                
                    <div className="space-y-4 sm:space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-foreground">
                          Описание
                        </label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          rows={4}
                          maxLength={500}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent resize-none transition-all duration-200 text-sm sm:text-base"
                          placeholder="Расскажите подробнее об этом объекте: его особенности, состояние, доступность..."
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.description.length} / 500 символов
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="address" className="block text-xs sm:text-sm font-semibold text-foreground">
                          Адрес
                        </label>
                        <input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                          placeholder="Например: ул. Ленина, д. 1, г. Тула"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600"
                    >
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {error}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
              </form>
              </div>

              <div className="sticky md:static bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:p-4 md:p-6 z-10 flex-shrink-0">
                {currentStep === 1 && (
                  <div className="flex justify-end gap-2 sm:gap-3">
                    <motion.button
                      type="button"
                      onClick={() => router.back()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-lg font-medium hover:bg-accent transition-all duration-200"
                    >
                      Отмена
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => canProceedToStep2 && setCurrentStep(2)}
                      disabled={!canProceedToStep2}
                      whileHover={{ scale: canProceedToStep2 ? 1.02 : 1 }}
                      whileTap={{ scale: canProceedToStep2 ? 0.98 : 1 }}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-foreground text-background rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      Далее
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="flex justify-between gap-2 sm:gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-lg font-medium hover:bg-accent transition-all duration-200 flex items-center gap-2"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      Назад
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => canProceedToStep3 && setCurrentStep(3)}
                      disabled={!canProceedToStep3}
                      whileHover={{ scale: canProceedToStep3 ? 1.02 : 1 }}
                      whileTap={{ scale: canProceedToStep3 ? 0.98 : 1 }}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-foreground text-background rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      Далее
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="flex justify-between gap-2 sm:gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-lg font-medium hover:bg-accent transition-all duration-200 flex items-center gap-2"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      Назад
                    </motion.button>
                    <motion.button
                      type="submit"
                      form="add-object-form"
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className="px-4 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-foreground text-background rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <ClockIcon className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Создание...</span>
                          <span className="sm:hidden">Создание</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Создать объект</span>
                          <span className="sm:hidden">Создать</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
      )}

      {!isPanelOpen && (
        <motion.button
          initial={{ x: 100, y: 100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ x: 100, y: 100, opacity: 0 }}
          onClick={() => setIsPanelOpen(true)}
          className="fixed right-4 bottom-4 md:top-24 md:bottom-auto z-30 px-4 py-3 bg-foreground text-background rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5 md:rotate-0 rotate-90" />
          <span className="hidden sm:inline">Открыть форму</span>
          <span className="sm:hidden">Форма</span>
        </motion.button>
      )}

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
