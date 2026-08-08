'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  MapPinIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  StarIcon,
  ArrowRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/components/UI/ThemeToggle';
import { apiClient } from '@/lib/api';

const CapsuleScene = dynamic(() => import('@/components/UI/CapsuleScene').then(mod => ({ default: mod.CapsuleScene })), {
  ssr: false,
  loading: () => (
    <div className="w-40 h-40 md:w-48 md:h-48 mx-auto mb-8 flex items-center justify-center">
      <div className="w-16 h-16 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<{
    objects: number | null;
    ratings: number | null;
    users: number | null;
  }>({
    objects: null,
    ratings: null,
    users: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      
      const scrollToTop = () => {
        const topElement = document.getElementById('top');
        if (topElement) {
          topElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      };
      
      scrollToTop();
      setTimeout(scrollToTop, 0);
      setTimeout(scrollToTop, 10);
    }
    
    const loadStats = async () => {
      try {
        const objectsData = await apiClient.getObjectsCount();
        setStats(prev => ({ ...prev, objects: objectsData.count }));
      } catch (error) {
        setStats(prev => ({ ...prev, objects: null }));
      }

      try {
        const ratingsData = await apiClient.getRatingsCount();
        setStats(prev => ({ ...prev, ratings: ratingsData.count }));
      } catch (error) {
        setStats(prev => ({ ...prev, ratings: null }));
      }

      try {
        const usersData = await apiClient.getUsersCount();
        setStats(prev => ({ ...prev, users: usersData.count }));
      } catch (error) {
        setStats(prev => ({ ...prev, users: null }));
      }
    };

    loadStats();
  }, []);

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const features = [
    {
      icon: MapPinIcon,
      title: 'Оценка объектов',
    },
    {
      icon: ChartBarIcon,
      title: 'Аналитика',
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Улучшение города',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Добавьте объект',
      description: 'Найдите объект на карте и добавьте его в систему',
      icon: MapPinIcon,
    },
    {
      number: '02',
      title: 'Оцените по критериям',
      description: 'Заполните форму оценки, выбрав подходящие критерии',
      icon: ChartBarIcon,
    },
    {
      number: '03',
      title: 'Влияйте на решения',
      description: 'Ваши оценки формируют индекс здоровья района',
      icon: BuildingOfficeIcon,
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-hidden">
      <div id="top" className="absolute top-0 left-0 w-0 h-0" aria-hidden="true" />
      
      <ThemeToggle />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                            linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <section ref={heroRef} id="hero" className="relative min-h-screen flex items-center overflow-hidden z-10">

        <motion.div
          style={{ y, opacity, scale }}
          className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center min-h-[85vh]">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={mounted ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 sm:space-y-6 md:space-y-8 z-20 order-2 lg:order-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-2 sm:gap-3"
              >
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border bg-muted/50 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-foreground rounded-full animate-pulse" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Интерактивная платформа</span>
                </div>
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={mounted ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-foreground/60" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{feature.title}</span>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="space-y-1 sm:space-y-2 md:space-y-4 pb-1">
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={mounted ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="block bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent pb-0.5">
                    Здоровая
                  </span>
                  <motion.span
                    className="block bg-gradient-to-r from-foreground/70 via-foreground/90 to-foreground bg-clip-text text-transparent pb-0.5"
                    initial={{ opacity: 0, x: -30 }}
                    animate={mounted ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    среда
                  </motion.span>
                </motion.h1>
              </div>

              <motion.p
                className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg pb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                Интерактивная платформа для оценки городской инфраструктуры и улучшения качества жизни
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 pt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/map"
                    className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-foreground text-background rounded-full font-medium overflow-hidden text-sm sm:text-base"
                  >
                    <motion.span
                      className="relative z-10 flex items-center gap-2 sm:gap-3"
                      whileHover={{ x: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      Начать работу
                      <ArrowRightIcon className="h-4 w-4 md:h-5 md:w-5" />
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-foreground/90 to-foreground"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  </Link>
                </motion.div>
                <motion.button
                  type="button"
                  onClick={() => {
                    const element = document.getElementById('process');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-border rounded-full font-medium hover:bg-accent transition-colors text-sm sm:text-base inline-block text-center cursor-pointer"
                >
                  Узнать больше
                </motion.button>
              </motion.div>

              <motion.div
                className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-3 sm:pt-4 md:pt-4"
                initial={{ opacity: 0 }}
                animate={mounted ? { opacity: 1 } : {}}
                transition={{ delay: 1.1 }}
              >
                {[
                  { value: stats.objects, label: 'Объектов', key: 'objects' },
                  { value: stats.ratings, label: 'Оценок', key: 'ratings' },
                  { value: stats.users, label: 'Пользователей', key: 'users' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={mounted ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.2 + i * 0.1 }}
                  >
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight pb-0.5">
                      {stat.value !== null ? `${stat.value}+` : '∞'}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-tight">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={mounted ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full h-[250px] xs:h-[300px] sm:h-[350px] md:h-[450px] lg:h-[500px] xl:h-[600px] z-20 flex items-center justify-center order-1 lg:order-2 hidden lg:flex"
            >
              <motion.div
                className="relative w-full max-w-md h-full rounded-2xl sm:rounded-3xl border border-border/50 bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 backdrop-blur-md overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-foreground/10 to-foreground/5" />
                
                <div className="relative z-10 h-full flex flex-col">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={mounted ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm flex-shrink-0"
                  >
                    <div className="h-2.5 sm:h-3.5 w-16 sm:w-20 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded-md" />
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="h-5 w-10 sm:h-6 sm:w-12 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded-md" />
                      <div className="h-5 w-10 sm:h-6 sm:w-12 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded-md" />
                      <div className="h-5 w-10 sm:h-6 sm:w-12 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded-md hidden sm:block" />
                    </div>
                  </motion.div>
                  
                  <div className="flex-1 relative overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={mounted ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.6 }}
                      className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20 bg-background/95 backdrop-blur-xl border border-border/60 rounded-lg sm:rounded-xl shadow-xl w-28 sm:w-36 md:w-40 overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 bg-gradient-to-b from-primary/15 via-primary/8 to-transparent pointer-events-none" />
                      
                      <div className="p-2 sm:p-2.5 border-b border-border/50 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 bg-background/60 backdrop-blur-sm relative z-10">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary/30 rounded-md" />
                        <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded-md" />
                      </div>
                      
                      <div className="p-2 sm:p-2.5 space-y-2 sm:space-y-2.5 relative z-10">
                        <div className="h-1.5 sm:h-2 w-12 sm:w-14 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded" />
                        <div className="space-y-1 sm:space-y-1.5">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary/20 rounded" />
                            <div className="h-1.5 sm:h-2 flex-1 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded" />
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary/20 rounded" />
                            <div className="h-1.5 sm:h-2 flex-1 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded" />
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2.5 h-2.5 bg-primary/20 rounded" />
                            <div className="h-2 flex-1 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <div className="absolute top-1/3 right-1/4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary/40 rounded-full shadow-lg" />
                    <div className="absolute top-1/2 left-1/3 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary/40 rounded-full shadow-lg" />
                    <div className="absolute bottom-1/3 right-1/3 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary/40 rounded-full shadow-lg hidden sm:block" />
                    
                    <div className="absolute inset-0 opacity-[0.04]">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                                        linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }} />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-foreground/5 to-transparent" />
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={mounted ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-t border-border/40 bg-background/60 backdrop-blur-sm flex-shrink-0"
                  >
                    <div className="flex gap-1 sm:gap-1.5 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1 sm:p-1.5 shadow-md">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-foreground/15 to-foreground/10 rounded-md" />
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-foreground/15 to-foreground/10 rounded-md" />
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-foreground/15 to-foreground/10 rounded-md hidden sm:block" />
                    </div>
                    <div className="flex-1" />
                    <div className="h-1.5 sm:h-2 w-20 sm:w-24 bg-gradient-to-r from-foreground/15 to-foreground/10 rounded" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>
                <div className="absolute top-6 sm:top-10 right-4 sm:right-6 text-xl sm:text-2xl md:text-3xl font-bold text-muted-foreground/30">
                    01
                </div>
      </section>

      <section id="process" className="relative min-h-screen flex items-center border-t border-border bg-background overflow-hidden z-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 4px,
                currentColor 4px,
                currentColor 5px
              )`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-center min-h-[80vh]">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-3 relative hidden lg:block"
              >
                <motion.div
                  className="writing-vertical-rl text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                  }}
                >
                  ПРОЦЕСС
                </motion.div>
                <div className="absolute -top-10 left-6 text-2xl md:text-3xl font-bold text-muted-foreground/30">
                  02
                </div>
              </motion.div>

              {/* Mobile Title */}
              <div className="lg:hidden mb-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 leading-tight pb-0.5">ПРОЦЕСС</h2>
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground/30 leading-tight">02</div>
              </div>

              <div className="lg:col-span-6 lg:col-start-4 space-y-6 sm:space-y-8 md:space-y-12">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                        <motion.div
                          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg bg-foreground text-background flex items-center justify-center text-base sm:text-lg md:text-xl font-bold"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          {step.number}
                        </motion.div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-foreground/60" />
                            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight pb-0.5">
                              {step.title}
                            </h3>
                          </div>
                          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl pb-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-3 relative mt-2 sm:mt-4 lg:mt-0"
              >
                <div className="relative w-full max-w-[200px] sm:max-w-[240px] md:max-w-none h-32 sm:h-40 md:h-48 mx-auto mb-3 sm:mb-4" style={{ minHeight: '128px' }}>
                  <CapsuleScene className="w-full h-full" />
                </div>

                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground text-center lg:text-left">
                  <p className="leading-relaxed pb-0.5">
                    Интерактивная платформа для оценки городской инфраструктуры
                  </p>
                  <div className="h-px bg-border" />
                  <p className="leading-relaxed pb-0.5">
                    Визуализация данных и аналитика для принятия решений
                  </p>
                
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-screen flex items-center border-t border-border bg-background overflow-hidden z-10">

        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 relative z-10 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-6 w-full items-center">
              
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-3 relative hidden lg:block"
              >
                <motion.div
                  className="writing-vertical-rl text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight relative"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="relative z-10 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                    ПРИСОЕДИНЯЙТЕСЬ
                  </span>
                </motion.div>
                <div className="absolute -top-10 left-2.5 text-2xl md:text-3xl font-bold text-muted-foreground/30">
                  03
                </div>
              </motion.div>

              {/* Mobile Title */}
              <div className="lg:hidden mb-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight pb-0.5">ПРИСОЕДИНЯЙТЕСЬ</h2>
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground/30 leading-tight">03</div>
              </div>

              <div className="lg:col-span-6 lg:col-start-4 relative">
                <div className="relative">

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{
                      duration: 0.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative z-10 space-y-4 sm:space-y-5 md:space-y-6"
                  >
                    <div className="space-y-1.5 sm:space-y-2 pb-1">
                      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.2] tracking-tight">
                        <motion.span
                          className="block bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent py-0.5"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 }}
                        >
                          Готовы улучшать
                        </motion.span>
                        <motion.span
                          className="block text-muted-foreground mt-1 py-0.5"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 }}
                        >
                          город вместе?
                        </motion.span>
                      </h2>
                    </div>

                    <motion.p
                      className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg pb-1"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      Присоединяйтесь к платформе, чтобы влиять на городскую среду и улучшать качество жизни
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="pt-2"
                    >
                      <Link
                        href="/map"
                        className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-foreground text-background rounded-full font-medium text-sm sm:text-base overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <motion.span
                          className="relative z-10 flex items-center gap-2 sm:gap-3"
                          whileHover={{ x: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          Начать сейчас
                          <ArrowRightIcon className="h-4 w-4 md:h-5 md:w-5" />
                        </motion.span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-foreground/90 to-foreground"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-3 relative space-y-3 sm:space-y-4 md:space-y-5 mt-6 lg:mt-0"
              >
                <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border bg-muted/40 backdrop-blur-sm hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <motion.div
                      className="w-1.5 h-1.5 bg-foreground rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">СООБЩЕСТВО</span>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-3 leading-relaxed"
                  >
                    <p>
                      Вместе создаем
                      <br />
                      карту здоровья города
                    </p>
                    <div className="h-px bg-border w-16 sm:w-20" />
                    <p>
                      Каждая оценка влияет
                      <br />
                      на общую картину
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
