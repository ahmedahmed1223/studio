
import React, { Suspense } from 'react'; // Import React
import { HeadlineTable } from '@/components/headlines/headline-table';
import { getCategories, getHeadlines, HeadlineFilters as HeadlineFilterType, GetHeadlinesResult } from '@/services/headline'; // Use GetHeadlinesResult
import type { HeadlineState, Category, Headline } from '@/services/headline';
import { HeadlineTableSkeleton } from '@/components/headlines/headline-table-skeleton';
import { HeadlineFilters } from '@/components/headlines/headline-filters';
import { CreateHeadlineButton } from '@/components/headlines/create-headline-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchHeadlineInput } from '@/components/headlines/search-headline-input';

// Define props similar to DashboardPage
interface BreakingNewsPageProps {
  searchParams: {
    page?: string;
    state?: HeadlineState;
    category?: string;
    search?: string;
  };
}

export default async function BreakingNewsPage({ searchParams }: BreakingNewsPageProps) {
  const currentPage = Number(searchParams.page) || 1;
  const selectedState = searchParams.state;
  const selectedCategory = searchParams.category;
  const searchTerm = searchParams.search;
  const pageSize = 10;

  const categories = await getCategories();

  // Define filters for BREAKING headlines
  const filters: HeadlineFilterType = {
    states: selectedState ? [selectedState] : undefined,
    category: selectedCategory,
    search: searchTerm,
    isBreaking: true, // Explicitly fetch ONLY breaking news
  };

  // Key for Suspense based on search params to trigger refetch
  const tableKey = JSON.stringify({...searchParams, list: 'breaking'});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Breaking News</h1>
        <CreateHeadlineButton categories={categories} isBreaking={true} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter &amp; Search Breaking News</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <HeadlineFilters categories={categories} />
           <SearchHeadlineInput />
        </CardContent>
      </Card>

      <Suspense key={tableKey} fallback={<HeadlineTableSkeleton />}>
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

// Helper component to handle async data fetching for the table
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
  // getHeadlines now returns headlines with Date objects
  const { headlines, totalCount }: GetHeadlinesResult = await getHeadlines(filters, page, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <HeadlineTable
      headlines={headlines} // Pass headlines with Date objects
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      isBreakingNewsList={true} // Pass flag to table
    />
  );
}

