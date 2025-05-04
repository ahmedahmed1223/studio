
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Category, HeadlineState } from '@/services/headline';
import { useLanguage } from '@/context/language-context';
import { useCallback } from 'react';

interface HeadlineFiltersProps {
  categories: Category[];
}

const headlineStates: HeadlineState[] = ['Draft', 'In Review', 'Approved', 'Archived'];

export function HeadlineFilters({ categories }: HeadlineFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const currentState = searchParams.get('state') ?? '';
  const currentCategory = searchParams.get('category') ?? '';

  // Use useCallback for stable function references
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        if (value) {
          current.set(name, value);
        } else {
          current.delete(name);
        }
      });
      current.delete('page'); // Always reset page on filter change

      return current.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (type: 'state' | 'category', value: string) => {
    const newValue = value === 'all' ? undefined : value;
    const queryString = createQueryString({ [type]: newValue });
    router.push(`${pathname}?${queryString}`);
  };

  const clearFilters = () => {
     // Keep search query if present, clear state and category
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete('state');
    current.delete('category');
    current.delete('page');
    const queryString = current.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select value={currentState} onValueChange={(value) => handleFilterChange('state', value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('filterByState')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allStates')}</SelectItem>
          {headlineStates.map((state) => (
            <SelectItem key={state} value={state}>{t(state.toLowerCase().replace(' ', ''))}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentCategory} onValueChange={(value) => handleFilterChange('category', value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('filterByCategory')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allCategories')}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(currentState || currentCategory) && (
        <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
          {t('clearFilters')}
        </Button>
      )}
    </div>
  );
}
