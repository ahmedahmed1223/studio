
import { HeadlineTable } from '@/components/headlines/headline-table';
import { getCategories, getHeadlines } from '@/services/headline';
import type { HeadlineState, Category } from '@/services/headline';
import { Suspense } from 'react';
import { HeadlineTableSkeleton } from '@/components/headlines/headline-table-skeleton';
import { HeadlineFilters } from '@/components/headlines/headline-filters';
import { CreateHeadlineButton } from '@/components/headlines/create-headline-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardPageProps {
  searchParams: {
    page?: string;
    state?: HeadlineState;
    category?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentPage = Number(searchParams.page) || 1;
  const selectedState = searchParams.state;
  const selectedCategory = searchParams.category;
  const pageSize = 10; // Define how many headlines per page

  const categories = await getCategories();

  // Pass filters to getHeadlines
  const filters = {
    states: selectedState ? [selectedState] : undefined, // Use states array
    category: selectedCategory,
  };

  // We pass the key to force re-render when searchParams change
  const tableKey = JSON.stringify(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Headlines Dashboard</h1>
        <CreateHeadlineButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Headlines</CardTitle>
        </CardHeader>
        <CardContent>
           <HeadlineFilters categories={categories} />
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
  filters: { states?: HeadlineState[]; category?: string }; // Update filter type
  page: number;
  pageSize: number;
  categories: Category[];
}) {
  const headlines = await getHeadlines(filters, page, pageSize);
  // TODO: Get total count for pagination from getHeadlines or a separate count function
   // Fetch total count based on filters for accurate pagination
   const allFilteredHeadlines = await getHeadlines(filters, 0, 0); // Fetch all matching headlines
   const totalHeadlines = allFilteredHeadlines.length;
  const totalPages = Math.ceil(totalHeadlines / pageSize);

  return (
    <HeadlineTable
      headlines={headlines}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}

