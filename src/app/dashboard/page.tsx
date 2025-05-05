

import React, { Suspense } from 'react'; // Import React
import { HeadlineTable } from '@/components/headlines/headline-table';
import { getCategories, getHeadlines, HeadlineFilters as HeadlineFilterType, GetHeadlinesResult } from '@/services/headline'; // Use GetHeadlinesResult
import type { HeadlineState, Category, Headline } from '@/services/headline';
import { HeadlineTableSkeleton } from '@/components/headlines/headline-table-skeleton';
import { HeadlineFilters } from '@/components/headlines/headline-filters';
import { CreateHeadlineButton } from '@/components/headlines/create-headline-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchHeadlineInput } from '@/components/headlines/search-headline-input';
import { useLanguage } from '@/context/language-context'; // Import useLanguage

/**
 * Props for the DashboardPage component.
 * Includes search parameters for filtering and pagination.
 */
interface DashboardPageProps {
  searchParams: {
    page?: string;
    state?: HeadlineState;
    category?: string;
    search?: string;
  };
}

/**
 * The main dashboard page component.
 * Displays filters, search input, a button to create headlines, and a table of headlines.
 * Fetches all headlines (breaking and non-breaking) based on filters.
 *
 * @param {DashboardPageProps} props - The props for the component.
 * @returns {Promise<JSX.Element>} The rendered dashboard page.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Use the language hook here if needed for server-side translations, though often done client-side
  // const { t } = useLanguage(); // This might cause issues in Server Components

  const currentPage = Number(searchParams.page) || 1;
  const selectedState = searchParams.state;
  const selectedCategory = searchParams.category;
  const searchTerm = searchParams.search;
  const pageSize = 10; // Number of headlines per page

  // Fetch categories for filter dropdowns and potentially other uses
  const categories = await getCategories();

  // Define filters for fetching headlines.
  // Remove `isBreaking: false` to fetch *all* headlines.
  const filters: HeadlineFilterType = {
    states: selectedState ? [selectedState] : undefined,
    category: selectedCategory,
    search: searchTerm,
    // isBreaking: false, // Removed: Fetch both breaking and non-breaking news
  };

  // Generate a unique key for Suspense based on search params to ensure refetch on change.
  const tableKey = JSON.stringify({...searchParams, list: 'all'});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Use dynamic title based on language context if possible, or keep static */}
        <h1 className="text-3xl font-bold tracking-tight">{"لوحة التحكم"}</h1> {/* Hardcoded Arabic for example */}
        <CreateHeadlineButton categories={categories} />
      </div>

      <Card>
        <CardHeader>
          {/* Use dynamic title */}
          <CardTitle>{"تصفية وبحث العناوين"}</CardTitle> {/* Hardcoded Arabic for example */}
        </CardHeader>
        <CardContent className="space-y-4">
           <HeadlineFilters categories={categories} />
           <SearchHeadlineInput />
        </CardContent>
      </Card>

      <Suspense key={tableKey} fallback={<HeadlineTableSkeleton />}>
        {/* Wrapper component to handle async data fetching for the table */}
        <HeadlineTableWrapper
          filters={filters}
          page={currentPage}
          pageSize={pageSize}
          categories={categories}
        />
      </Suspense>
    </div>
  );
}

/**
 * Helper component to fetch headline data asynchronously within a Suspense boundary.
 * Passes the fetched data and pagination info to the HeadlineTable.
 *
 * @param {object} props - Component props.
 * @param {HeadlineFilterType} props.filters - Filters to apply when fetching headlines.
 * @param {number} props.page - Current page number.
 * @param {number} props.pageSize - Number of headlines per page.
 * @param {Category[]} props.categories - List of available categories.
 * @returns {Promise<JSX.Element>} The rendered HeadlineTable with data.
 */
async function HeadlineTableWrapper({
  filters,
  page,
  pageSize,
  categories,
}: {
  filters: HeadlineFilterType;
  page: number;
  pageSize: number;
  categories: Category[];
}) {
  // Fetch headlines with Date objects using the provided filters and pagination.
  const { headlines, totalCount }: GetHeadlinesResult = await getHeadlines(filters, page, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <HeadlineTable
      headlines={headlines} // Pass headlines with Date objects
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      // isBreakingNewsList is omitted or false, as this table shows all news
    />
  );
}

