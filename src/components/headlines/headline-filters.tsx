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
import { useLanguage } from '@/context/language-context'; // Import language context

interface HeadlineFiltersProps {
  categories: Category[];
}

const headlineStates: HeadlineState[] = ['Draft', 'In Review', 'Approved', 'Archived'];

export function HeadlineFilters({ categories }: HeadlineFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage(); // Get translation function

  const currentState = searchParams.get('state') ?? '';
  const currentCategory = searchParams.get('category') ?? '';

  const handleFilterChange = (type: 'state' | 'category', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries())); // Convert to mutable object

    if (value) {
      current.set(type, value);
    } else {
      current.delete(type);
    }
    current.delete('page'); // Reset to first page on filter change

    const search = current.toString();
    const query = search ? `?${search}` : '';

    router.push(`${pathname}${query}`);
  };

  const clearFilters = () => {
    router.push(pathname); // Navigate to the base path without query params
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select value={currentState} onValueChange={(value) => handleFilterChange('state', value === 'all' ? '' : value)}>
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

      <Select value={currentCategory} onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}>
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
