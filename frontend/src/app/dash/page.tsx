'use client';

import { useMemo, useState } from 'react';
import { NavBar } from '@/components/Layout/NavBar';
import { useMapData } from '@/hooks/useMapData';
import { ExportButton } from '@/components/Dashboard/ExportButton';
import { AdvancedFilters } from '@/components/Dashboard/AdvancedFilters';
import { TULA_MUNICIPALITIES_GEOJSON } from '@/lib/geojson';
import {
  filterByDate,
  filterByType,
  filterByMunicipality,
} from '@/lib/dashboardUtils';
import type { GeoJSON } from 'geojson';
import dynamic from 'next/dynamic';
import type { InfrastructureObject, ObjectType } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent"></div>
    </div>
  ),
});

export default function DashPage() {
  const { objects: allObjects, isLoading } = useMapData();
  const isMobile = useIsMobile();
  
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<ObjectType>>(new Set());
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<Set<string>>(new Set());

  const handleResetFilters = () => {
    setSelectedYears(new Set());
    setSelectedMonths(new Set());
    setSelectedTypes(new Set());
    setSelectedMunicipalities(new Set());
  };

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const objects = useMemo(() => {
    let filtered = allObjects;
    
    filtered = filterByDate(filtered, selectedYears, selectedMonths);
    
    filtered = filterByType(filtered, selectedTypes);
    
    filtered = filterByMunicipality(filtered, selectedMunicipalities, TULA_MUNICIPALITIES_GEOJSON);
    
    return filtered;
  }, [allObjects, selectedYears, selectedMonths, selectedTypes, selectedMunicipalities]);

  const stats = useMemo(() => {
    const total = objects.length;
    const healthyFood = objects.filter(o => o.type === 'healthy_food').length;
    const medical = objects.filter(o => o.type === 'medical').length;
    const healthFacilities = objects.filter(o => o.type === 'health_facilities').length;
    
    const healthIndex = 72.5;

    const ratingsCount = 1247;

    const ratingDistribution = {
      high: 342,
      medium: 456,
      low: 189,
      noRating: 260,
    };

    const typeDistribution: Record<string, number> = {};
    objects.forEach((obj) => {
      typeDistribution[obj.type] = (typeDistribution[obj.type] || 0) + 1;
    });

    const municipalityDistribution: Record<string, number> = {
      'Все МО': total,
      'г. Тула': 0,
      'г. Новомосковск': 0,
      'г. Алексин': 0,
      'г. Ефремов': 0,
      'г. Щёкино': 0,
    };

    const averageRating = 3.64;

    return {
      total,
      healthyFood,
      medical,
      healthFacilities,
      healthIndex,
      ratingsCount,
      averageRating,
      ratingDistribution,
      typeDistribution,
      municipalityDistribution,
    };
  }, [objects]);

  const typeChartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--foreground)',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: isMobile ? 10 : 11,
      },
      padding: [8, 12],
      borderRadius: 6,
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      left: isMobile ? 'center' : 'left',
      top: isMobile ? 'bottom' : 'middle',
      textStyle: { 
        fontSize: isMobile ? 9 : 10,
        color: 'var(--foreground)',
      },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: isMobile ? 4 : 6,
    },
    series: [
      {
        name: 'Типы объектов',
        type: 'pie',
        radius: isMobile ? ['30%', '60%'] : ['40%', '70%'],
        center: isMobile ? ['50%', '45%'] : ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--background)',
          borderWidth: 2,
        },
        label: {
          show: !isMobile,
          formatter: '{b}: {c}\n({d}%)',
          fontSize: isMobile ? 8 : 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: isMobile ? 10 : 11,
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

  const ratingChartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--foreground)',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: isMobile ? 10 : 11,
      },
      padding: [8, 12],
      borderRadius: 6,
    },
    grid: {
      left: isMobile ? '10%' : '5%',
      right: isMobile ? '5%' : '5%',
      top: isMobile ? '12%' : '8%',
      bottom: isMobile ? '18%' : '8%',
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: isMobile 
        ? ['4+', '3-4', '<3', 'Нет']
        : ['Высокий (4+)', 'Средний (3-4)', 'Низкий (<3)', 'Без оценки'],
      axisLabel: { 
        fontSize: isMobile ? 8 : 9,
        color: 'var(--muted-foreground)',
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        fontSize: isMobile ? 8 : 9,
        color: 'var(--muted-foreground)',
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border)',
          type: 'dashed',
        },
      },
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
          fontSize: isMobile ? 8 : 9,
          color: 'var(--foreground)',
        },
        barWidth: isMobile ? '50%' : '60%',
      },
    ],
  }), [stats.ratingDistribution, isMobile]);

  const healthIndexChartOption = useMemo(() => {
    const municipalityHealthData: Array<{ name: string; value: number; total_ratings: number; population: number }> = [
      { name: 'г. Тула', value: 78.5, total_ratings: 456, population: 485221 },
      { name: 'г. Новомосковск', value: 75.2, total_ratings: 234, population: 125647 },
      { name: 'г. Алексин', value: 72.8, total_ratings: 189, population: 61234 },
      { name: 'г. Ефремов', value: 71.3, total_ratings: 156, population: 38456 },
      { name: 'г. Щёкино', value: 69.7, total_ratings: 123, population: 58234 },
      { name: 'г. Узловая', value: 68.4, total_ratings: 98, population: 52341 },
      { name: 'г. Донской', value: 67.1, total_ratings: 87, population: 64123 },
      { name: 'г. Кимовск', value: 65.8, total_ratings: 76, population: 28456 },
      { name: 'г. Богородицк', value: 64.2, total_ratings: 65, population: 31234 },
      { name: 'г. Белёв', value: 62.9, total_ratings: 54, population: 14567 },
    ];

    const avgHealthByMunicipality = municipalityHealthData.slice(0, 10);

    return {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--foreground)',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          const dataIndex = param.dataIndex;
          const municipalityData = avgHealthByMunicipality[dataIndex];
          if (municipalityData) {
            return `${param.name}<br/>ИЗМО: ${param.value.toFixed(2)}<br/>Оценок: ${municipalityData.total_ratings}<br/>Население: ${municipalityData.population.toLocaleString('ru-RU')}`;
          }
          return `${param.name}<br/>ИЗМО: ${param.value.toFixed(2)}`;
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 11,
        },
        padding: [8, 12],
        borderRadius: 6,
      },
      grid: {
        left: isMobile ? '12%' : '5%',
        right: isMobile ? '5%' : '5%',
        top: isMobile ? '12%' : '8%',
        bottom: isMobile ? '22%' : '15%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: avgHealthByMunicipality.map((item) => {
          const name = item.name.replace('городской округ', 'г.о.').replace('муниципальный район', 'м.р.');
          if (isMobile) {
            return name.length > 8 ? name.substring(0, 6) + '...' : name;
          }
          return name.length > 15 ? name.substring(0, 12) + '...' : name;
        }),
        axisLabel: { 
          fontSize: isMobile ? 8 : 9,
          color: 'var(--muted-foreground)',
          rotate: isMobile ? 60 : 45, 
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { 
          fontSize: isMobile ? 8 : 9,
          color: 'var(--muted-foreground)',
        },
        name: 'ИЗМО',
        nameTextStyle: { 
          fontSize: isMobile ? 9 : 10,
          color: 'var(--foreground)',
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border)',
            type: 'dashed',
          },
        },
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
            fontSize: isMobile ? 8 : 9,
            color: 'var(--foreground)',
          },
          barWidth: isMobile ? '50%' : '60%',
        },
      ],
    };
  }, [isMobile]);

  const ratingsTrendOption = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    const yearsToShow = selectedYears.size > 0 
      ? Array.from(selectedYears).sort()
      : [new Date().getFullYear()];
    
    const monthsToShow = selectedMonths.size > 0
      ? Array.from(selectedMonths).sort()
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    const mockMonthlyData = [89, 112, 134, 156, 178, 145, 167, 189, 201, 178, 156, 142];
    
    const displayedMonths = monthsToShow.map(m => months[m - 1]);
    const displayedData = monthsToShow.map(m => mockMonthlyData[m - 1]);
    
    return {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--foreground)',
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 11,
        },
        padding: [8, 12],
        borderRadius: 6,
      },
      grid: {
        left: isMobile ? '12%' : '5%',
        right: isMobile ? '5%' : '5%',
        top: isMobile ? '12%' : '8%',
        bottom: isMobile ? '15%' : '8%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: displayedMonths,
        axisLabel: { 
          fontSize: isMobile ? 8 : 9,
          color: 'var(--muted-foreground)',
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: { 
          fontSize: isMobile ? 8 : 9,
          color: 'var(--muted-foreground)',
        },
        name: 'Количество',
        nameTextStyle: { 
          fontSize: isMobile ? 9 : 10,
          color: 'var(--foreground)',
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'Оценок',
          type: 'line',
          data: displayedData,
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
            fontSize: isMobile ? 8 : 9,
            color: 'var(--foreground)',
          },
        },
      ],
    };
  }, [selectedYears, selectedMonths, isMobile]);

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

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar 
        filtersToggle={isMobile ? {
          isOpen: isFiltersOpen,
          onToggle: () => setIsFiltersOpen(!isFiltersOpen)
        } : undefined}
      />
      <div className={`flex-1 ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <div className={`flex flex-col container mx-auto px-3 sm:px-4 md:px-6 ${isMobile ? 'py-3 sm:py-4 pb-6' : 'py-2'} max-w-7xl ${isMobile ? '' : 'h-full overflow-y-auto'}`}>
          <div className={`${isMobile ? 'mb-3 sm:mb-4' : 'mb-2'} flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div className="flex-1 min-w-0">
              <h1 className={`${isMobile ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl'} font-bold ${isMobile ? 'mb-1 sm:mb-1.5' : 'mb-0.5'} text-foreground`}>
                Статистика и аналитика
              </h1>
              <p className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} text-muted-foreground hidden sm:block`}>
                Комплексный обзор данных по объектам инфраструктуры и оценкам
              </p>
            </div>
            <div className="flex-shrink-0">
              <ExportButton data={objects} stats={stats} />
            </div>
          </div>

          <div className={`${isMobile ? 'mb-3 sm:mb-4' : 'mb-2'} flex-shrink-0 overflow-visible`}>
            <AdvancedFilters
              allObjects={allObjects}
              selectedYears={selectedYears}
              selectedMonths={selectedMonths}
              selectedTypes={selectedTypes}
              selectedMunicipalities={selectedMunicipalities}
              municipalitiesGeoJSON={TULA_MUNICIPALITIES_GEOJSON}
              onYearsChange={setSelectedYears}
              onMonthsChange={setSelectedMonths}
              onTypesChange={setSelectedTypes}
              onMunicipalitiesChange={setSelectedMunicipalities}
              onReset={handleResetFilters}
              isAccordionOpen={isMobile ? isFiltersOpen : undefined}
              onAccordionToggle={isMobile ? () => setIsFiltersOpen(!isFiltersOpen) : undefined}
            />
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ${isMobile ? 'gap-2 sm:gap-3 mb-3 sm:mb-4' : 'gap-2 mb-2'} flex-shrink-0`}>
            <div className={`bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4' : 'p-2'}`}>
              <div className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-semibold text-muted-foreground ${isMobile ? 'mb-1 sm:mb-1.5' : 'mb-0.5'}`}>Всего объектов</div>
              <div className={`${isMobile ? 'text-lg sm:text-xl md:text-2xl' : 'text-lg'} font-bold text-foreground`}>{stats.total.toLocaleString('ru-RU')}</div>
            </div>
            <div className={`bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4' : 'p-2'}`}>
              <div className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-semibold text-muted-foreground ${isMobile ? 'mb-1 sm:mb-1.5' : 'mb-0.5'}`}>ИЗМО</div>
              <div className={`${isMobile ? 'text-lg sm:text-xl md:text-2xl' : 'text-lg'} font-bold text-foreground`}>{stats.healthIndex.toFixed(1)}</div>
            </div>
            <div className={`bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4' : 'p-2'}`}>
              <div className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-semibold text-muted-foreground ${isMobile ? 'mb-1 sm:mb-1.5' : 'mb-0.5'}`}>Всего оценок</div>
              <div className={`${isMobile ? 'text-lg sm:text-xl md:text-2xl' : 'text-lg'} font-bold text-foreground`}>{stats.ratingsCount.toLocaleString('ru-RU')}</div>
            </div>
            <div className={`bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4' : 'p-2'}`}>
              <div className={`${isMobile ? 'text-xs sm:text-sm' : 'text-xs'} font-semibold text-muted-foreground ${isMobile ? 'mb-1 sm:mb-1.5' : 'mb-0.5'}`}>Средний рейтинг</div>
              <div className={`${isMobile ? 'text-lg sm:text-xl md:text-2xl' : 'text-lg'} font-bold text-foreground`}>
                {stats.averageRating.toFixed(2)}
              </div>
            </div>
          </div>

          <div className={`flex flex-col ${isMobile ? 'gap-3 sm:gap-4 pb-4' : 'gap-2 flex-1 overflow-hidden min-h-0'}`}>
            <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} ${isMobile ? 'gap-3 sm:gap-4' : 'gap-2 flex-1 min-h-0'}`}>
              <div className={`flex flex-col bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4 min-h-[300px]' : 'p-2 min-h-0 overflow-hidden flex-1'}`}>
                <h3 className={`${isMobile ? 'text-sm sm:text-base' : 'text-xs'} font-semibold ${isMobile ? 'mb-2 sm:mb-3' : 'mb-1'} text-foreground flex-shrink-0`}>Распределение по типам</h3>
                <div className={`${isMobile ? 'flex-1 min-h-[250px]' : 'flex-1 min-h-0'}`}>
                  <ReactECharts
                    option={typeChartOption}
                    style={{ height: '100%', width: '100%', minHeight: isMobile ? '250px' : '0' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              </div>

              <div className={`flex flex-col bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4 min-h-[300px]' : 'p-2 min-h-0 overflow-hidden flex-1'}`}>
                <h3 className={`${isMobile ? 'text-sm sm:text-base' : 'text-xs'} font-semibold ${isMobile ? 'mb-2 sm:mb-3' : 'mb-1'} text-foreground flex-shrink-0`}>Распределение по рейтингам</h3>
                <div className={`${isMobile ? 'flex-1 min-h-[250px]' : 'flex-1 min-h-0'}`}>
                  <ReactECharts
                    option={ratingChartOption}
                    style={{ height: '100%', width: '100%', minHeight: isMobile ? '250px' : '0' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} ${isMobile ? 'gap-3 sm:gap-4' : 'gap-2 flex-1 min-h-0'}`}>
              <div className={`flex flex-col bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4 min-h-[300px]' : 'p-2 min-h-0 overflow-hidden flex-1'}`}>
                <h3 className={`${isMobile ? 'text-sm sm:text-base' : 'text-xs'} font-semibold ${isMobile ? 'mb-2 sm:mb-3' : 'mb-1'} text-foreground flex-shrink-0`}>ИЗМО по муниципалитетам</h3>
                <div className={`${isMobile ? 'flex-1 min-h-[250px]' : 'flex-1 min-h-0'}`}>
                  <ReactECharts
                    option={healthIndexChartOption}
                    style={{ height: '100%', width: '100%', minHeight: isMobile ? '250px' : '0' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              </div>

              <div className={`flex flex-col bg-muted/50 rounded-lg border border-border ${isMobile ? 'p-3 sm:p-4 min-h-[300px]' : 'p-2 min-h-0 overflow-hidden flex-1'}`}>
                <h3 className={`${isMobile ? 'text-sm sm:text-base' : 'text-xs'} font-semibold ${isMobile ? 'mb-2 sm:mb-3' : 'mb-1'} text-foreground flex-shrink-0`}>Динамика оценок</h3>
                <div className={`${isMobile ? 'flex-1 min-h-[250px]' : 'flex-1 min-h-0'}`}>
                  <ReactECharts
                    option={ratingsTrendOption}
                    style={{ height: '100%', width: '100%', minHeight: isMobile ? '250px' : '0' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



