'use client';

import { useMemo } from 'react';
import { NavBar } from '@/components/Layout/NavBar';
import { useMapData } from '@/hooks/useMapData';
import dynamic from 'next/dynamic';
import type { InfrastructureObject } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';

// Динамический импорт для избежания SSR проблем с echarts
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent"></div>
    </div>
  ),
});

// Маппинг муниципалитетов
const MUNICIPALITY_LABELS: Record<string, string> = {
  all: 'Все МО',
  tula: 'г. Тула',
  novomoskovsk: 'г. Новомосковск',
  aleksin: 'г. Алексин',
  efremov: 'г. Ефремов',
  shchekino: 'г. Щёкино',
};

// Функция для расчета ИЗМО (Индекс здоровья МО)
function calculateHealthIndex(objects: InfrastructureObject[]): number {
  if (objects.length === 0) return 0;
  const objectsWithIndex = objects.filter(obj => obj.healthIndex !== undefined);
  if (objectsWithIndex.length === 0) return 0;
  const sum = objectsWithIndex.reduce((acc, obj) => acc + (obj.healthIndex || 0), 0);
  return sum / objectsWithIndex.length;
}

export default function StatsPage() {
  const { objects, isLoading } = useMapData();
  const isMobile = useIsMobile();

  // Расчет статистики
  const stats = useMemo(() => {
    const total = objects.length;
    const healthyFood = objects.filter(o => o.type === 'healthy_food').length;
    const medical = objects.filter(o => o.type === 'medical').length;
    const healthFacilities = objects.filter(o => o.type === 'health_facilities').length;
    const healthIndex = calculateHealthIndex(objects);
    const ratingsCount = objects.reduce((sum, obj) => sum + obj.ratingsCount, 0);

    // Распределение по рейтингам
    const ratingDistribution = {
      high: 0, // 4+
      medium: 0, // 3-4
      low: 0, // <3
      noRating: 0,
    };

    objects.forEach((obj) => {
      const rating = obj.averageRating;
      if (!rating) {
        ratingDistribution.noRating++;
      } else if (rating >= 4) {
        ratingDistribution.high++;
      } else if (rating >= 3) {
        ratingDistribution.medium++;
      } else {
        ratingDistribution.low++;
      }
    });

    // Распределение по типам
    const typeDistribution: Record<string, number> = {};
    objects.forEach((obj) => {
      typeDistribution[obj.type] = (typeDistribution[obj.type] || 0) + 1;
    });

    // Распределение по муниципалитетам (примерное)
    const municipalityDistribution: Record<string, number> = {
      'Все МО': total,
      'г. Тула': 0,
      'г. Новомосковск': 0,
      'г. Алексин': 0,
      'г. Ефремов': 0,
      'г. Щёкино': 0,
    };

    return {
      total,
      healthyFood,
      medical,
      healthFacilities,
      healthIndex,
      ratingsCount,
      ratingDistribution,
      typeDistribution,
      municipalityDistribution,
    };
  }, [objects]);

  // Опции для графика распределения по типам объектов
  const typeChartOption = useMemo(() => ({
    title: {
      text: 'Распределение по типам объектов',
      left: 'center',
      textStyle: { fontSize: isMobile ? 12 : 14, fontWeight: 'bold' },
      top: isMobile ? 5 : 10,
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      textStyle: { fontSize: isMobile ? 10 : 11 },
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      left: isMobile ? 'center' : 'left',
      top: isMobile ? 'bottom' : 'middle',
      textStyle: { fontSize: isMobile ? 9 : 11 },
      itemGap: isMobile ? 4 : 8,
    },
    series: [
      {
        name: 'Типы объектов',
        type: 'pie',
        radius: isMobile ? ['30%', '60%'] : ['40%', '70%'],
        center: isMobile ? ['50%', '45%'] : ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'var(--background)',
          borderWidth: 2,
        },
        label: {
          show: !isMobile,
          formatter: '{b}: {c}\n({d}%)',
          fontSize: isMobile ? 8 : 11,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: isMobile ? 10 : 12,
            fontWeight: 'bold',
          },
        },
        data: Object.entries(stats.typeDistribution).map(([type, count]) => ({
          value: count,
          name: type === 'healthy_food' ? 'Здоровое питание' : 
                type === 'alcohol_tobacco' ? 'Алкоголь и табак' :
                type === 'health_facilities' ? 'Объекты здоровья' :
                type === 'industrial' ? 'Промышленные' :
                type === 'waste_collection' ? 'Сбор мусора' :
                type === 'education' ? 'Образование' :
                type === 'medical' ? 'Медицина' : type,
        })),
      },
    ],
  }), [stats.typeDistribution, isMobile]);

  // Опции для графика распределения по рейтингам
  const ratingChartOption = useMemo(() => ({
    title: {
      text: 'Распределение по рейтингам',
      left: 'center',
      textStyle: { fontSize: isMobile ? 12 : 14, fontWeight: 'bold' },
      top: isMobile ? 5 : 10,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      textStyle: { fontSize: isMobile ? 10 : 11 },
    },
    grid: {
      left: isMobile ? '10%' : '3%',
      right: isMobile ? '5%' : '4%',
      bottom: isMobile ? '20%' : '3%',
      top: isMobile ? '20%' : '15%',
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: isMobile 
        ? ['4+', '3-4', '<3', 'Нет']
        : ['Высокий (4+)', 'Средний (3-4)', 'Низкий (<3)', 'Без оценки'],
      axisLabel: { fontSize: isMobile ? 8 : 11, rotate: 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: isMobile ? 8 : 11 },
    },
    series: [
      {
        name: 'Количество объектов',
        type: 'bar',
        data: [
          stats.ratingDistribution.high,
          stats.ratingDistribution.medium,
          stats.ratingDistribution.low,
          stats.ratingDistribution.noRating,
        ],
        itemStyle: {
          color: (params: any) => {
            const colors = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];
            return colors[params.dataIndex];
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: !isMobile,
          position: 'top',
          fontSize: isMobile ? 8 : 11,
        },
        barWidth: isMobile ? '50%' : '60%',
      },
    ],
  }), [stats.ratingDistribution, isMobile]);

  // Опции для графика ИЗМО по муниципалитетам
  const healthIndexChartOption = useMemo(() => {
    // Группируем объекты по муниципалитетам (примерно)
    const municipalityHealth: Record<string, number[]> = {};
    objects.forEach((obj) => {
      // Простое распределение по координатам (в реальности нужна точная логика)
      const key = 'Все МО';
      if (!municipalityHealth[key]) {
        municipalityHealth[key] = [];
      }
      if (obj.healthIndex !== undefined) {
        municipalityHealth[key].push(obj.healthIndex);
      }
    });

    const avgHealthByMunicipality = Object.entries(municipalityHealth).map(([name, values]) => ({
      name,
      value: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    }));

    return {
      title: {
        text: 'Индекс здоровья МО (ИЗМО)',
        left: 'center',
        textStyle: { fontSize: isMobile ? 12 : 14, fontWeight: 'bold' },
        top: isMobile ? 5 : 10,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>ИЗМО: ${param.value.toFixed(2)}`;
        },
        textStyle: { fontSize: isMobile ? 10 : 11 },
      },
      grid: {
        left: isMobile ? '12%' : '3%',
        right: isMobile ? '5%' : '4%',
        bottom: isMobile ? '25%' : '3%',
        top: isMobile ? '20%' : '15%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: avgHealthByMunicipality.map((item) => {
          const name = item.name.replace('городской округ', 'г.о.').replace('муниципальный район', 'м.р.');
          return isMobile && name.length > 8 ? name.substring(0, 6) + '...' : name;
        }),
        axisLabel: { 
          fontSize: isMobile ? 8 : 11, 
          rotate: isMobile ? 60 : 0,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { fontSize: isMobile ? 8 : 11 },
        name: 'ИЗМО',
        nameTextStyle: { fontSize: isMobile ? 9 : 11 },
      },
      series: [
        {
          name: 'ИЗМО',
          type: 'bar',
          data: avgHealthByMunicipality.map((item) => item.value),
          itemStyle: {
            color: (params: any) => {
              const value = params.value;
              if (value >= 80) return '#10b981';
              if (value >= 60) return '#f59e0b';
              if (value >= 40) return '#f97316';
              return '#ef4444';
            },
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: !isMobile,
            position: 'top',
            formatter: '{c}',
            fontSize: isMobile ? 8 : 11,
          },
          barWidth: isMobile ? '50%' : '60%',
        },
      ],
    };
  }, [objects, isMobile]);

  // Опции для графика динамики оценок
  const ratingsTrendOption = useMemo(() => {
    // Примерные данные по месяцам (в реальности нужно получать с бэкенда)
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    const ratingsData = months.map(() => Math.floor(Math.random() * 50) + 10);
    
    return {
      title: {
        text: 'Динамика оценок',
        left: 'center',
        textStyle: { fontSize: isMobile ? 12 : 14, fontWeight: 'bold' },
        top: isMobile ? 5 : 10,
      },
      tooltip: {
        trigger: 'axis',
        textStyle: { fontSize: isMobile ? 10 : 11 },
      },
      grid: {
        left: isMobile ? '12%' : '3%',
        right: isMobile ? '5%' : '4%',
        bottom: isMobile ? '15%' : '3%',
        top: isMobile ? '20%' : '15%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: isMobile ? 8 : 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: isMobile ? 8 : 11 },
        name: 'Количество',
        nameTextStyle: { fontSize: isMobile ? 9 : 11 },
      },
      series: [
        {
          name: 'Оценок',
          type: 'line',
          data: ratingsData,
          smooth: true,
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          label: {
            show: !isMobile,
            position: 'top',
            fontSize: isMobile ? 8 : 10,
          },
        },
      ],
    };
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavBar />
        <div className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto"></div>
            <p className="mt-6 text-sm text-muted-foreground font-medium">
              Загрузка статистики...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const healthIndexColor = stats.healthIndex >= 80 ? '#10b981' :
                           stats.healthIndex >= 60 ? '#f59e0b' :
                           stats.healthIndex >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 max-w-7xl">
          {/* Заголовок */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Статистика и аналитика</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Обзор данных по объектам инфраструктуры и оценкам
            </p>
          </div>

          {/* Ключевые метрики */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            <div className="bg-muted/50 rounded-lg border border-border p-2 sm:p-3 md:p-4">
              <div className="text-xs text-muted-foreground uppercase mb-1">Всего объектов</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-muted/50 rounded-lg border border-border p-2 sm:p-3 md:p-4">
              <div className="text-xs text-muted-foreground uppercase mb-1">ИЗМО</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: healthIndexColor }}>
                {stats.healthIndex.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg border border-border p-2 sm:p-3 md:p-4">
              <div className="text-xs text-muted-foreground uppercase mb-1">Всего оценок</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.ratingsCount}</div>
            </div>
            <div className="bg-muted/50 rounded-lg border border-border p-2 sm:p-3 md:p-4">
              <div className="text-xs text-muted-foreground uppercase mb-1">Средний рейтинг</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">
                {objects.length > 0
                  ? (objects
                      .filter((o) => o.averageRating !== undefined)
                      .reduce((sum, o) => sum + (o.averageRating || 0), 0) /
                      objects.filter((o) => o.averageRating !== undefined).length || 0
                    ).toFixed(2)
                  : '0.00'}
              </div>
            </div>
          </div>

          {/* Графики */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            {/* Распределение по типам */}
            <div className="bg-background rounded-lg border border-border p-2 sm:p-3 md:p-4" style={{ minHeight: isMobile ? '280px' : 'auto' }}>
              <ReactECharts
                option={typeChartOption}
                style={{ height: isMobile ? '260px' : '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>

            {/* Распределение по рейтингам */}
            <div className="bg-background rounded-lg border border-border p-2 sm:p-3 md:p-4" style={{ minHeight: isMobile ? '280px' : 'auto' }}>
              <ReactECharts
                option={ratingChartOption}
                style={{ height: isMobile ? '260px' : '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* ИЗМО по муниципалитетам */}
            <div className="bg-background rounded-lg border border-border p-2 sm:p-3 md:p-4" style={{ minHeight: isMobile ? '280px' : 'auto' }}>
              <ReactECharts
                option={healthIndexChartOption}
                style={{ height: isMobile ? '260px' : '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>

            {/* Динамика оценок */}
            <div className="bg-background rounded-lg border border-border p-2 sm:p-3 md:p-4" style={{ minHeight: isMobile ? '280px' : 'auto' }}>
              <ReactECharts
                option={ratingsTrendOption}
                style={{ height: isMobile ? '260px' : '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



