'use client';

import { useState } from 'react';
import type { Criteria, CriteriaSet } from '@/types';

interface CriteriaSelectorProps {
  criteriaSet: CriteriaSet;
  values: Record<string, number | string>;
  onChange: (criterionId: string, value: number | string) => void;
}

export function CriteriaSelector({
  criteriaSet,
  values,
  onChange,
}: CriteriaSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold">{criteriaSet.name}</h3>
      {criteriaSet.criteria.map((criterion) => (
        <div key={criterion.id} className="space-y-1.5">
          <label className="block text-[10px] font-medium">
            {criterion.name}
            {criterion.description && (
              <span className="ml-1.5 text-[9px] text-muted-foreground">
                ({criterion.description})
              </span>
            )}
          </label>
          
          {criterion.type === 'rating' && (
            <StarRating
              value={values[criterion.id] as number || 0}
              onChange={(value) => onChange(criterion.id, value)}
              max={5}
            />
          )}
          
          {criterion.type === 'slider' && (
            <SliderInput
              value={values[criterion.id] as number || (criterion.min || 0)}
              onChange={(value) => onChange(criterion.id, value)}
              min={criterion.min || 0}
              max={criterion.max || 10}
            />
          )}
          
          {criterion.type === 'select' && criterion.options && (
            <SelectInput
              value={values[criterion.id] as string || ''}
              onChange={(value) => onChange(criterion.id, value)}
              options={criterion.options}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            className="text-base focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label={`Оценить ${starValue} из ${max}`}
          >
            {starValue <= value ? '⭐' : '☆'}
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-1.5 text-[10px] text-muted-foreground">
          {value} / {max}
        </span>
      )}
    </div>
  );
}

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function SliderInput({ value, onChange, min, max }: SliderInputProps) {
  return (
    <div className="space-y-1">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <span className="font-medium">{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function SelectInput({ value, onChange, options }: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Выберите значение</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}



