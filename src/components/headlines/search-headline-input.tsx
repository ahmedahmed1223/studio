
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Button } from '../ui/button';
import { useLanguage } from '@/context/language-context';

export function SearchHeadlineInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const initialSearchTerm = searchParams.get('search') ?? '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Update local state if URL changes externally
  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '');
  }, [searchParams]);

  const createQueryString = useCallback(
    (name: string, value: string | undefined) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (value) {
        current.set(name, value);
      } else {
        current.delete(name);
      }
      current.delete('page'); // Reset page on search change
      return current.toString();
    },
    [searchParams]
  );

  // Debounce the router push to avoid excessive updates while typing
  const debouncedSearch = useDebouncedCallback((term: string) => {
    const queryString = createQueryString('search', term || undefined);
    router.push(`${pathname}?${queryString}`);
  }, 300); // 300ms debounce

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const clearSearch = () => {
      setSearchTerm('');
      const queryString = createQueryString('search', undefined);
      router.push(`${pathname}?${queryString}`);
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
      <Input
        type="search"
        placeholder={t('searchHeadlinesPlaceholder')}
        value={searchTerm}
        onChange={handleInputChange}
        className="pl-10 pr-10 rtl:pr-10 rtl:pl-10" // Add padding for icons
        aria-label={t('searchHeadlinesPlaceholder')}
      />
       {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rtl:left-1 rtl:right-auto"
          onClick={clearSearch}
          aria-label={t('clearSearch')}
        >
          <X className="h-4 w-4" />
        </Button>
       )}
    </div>
  );
}
