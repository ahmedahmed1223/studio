
import { HeadlineTable } from '@/components/headlines/headline-table';
import { getCategories, getHeadlines, HeadlineFilters as HeadlineFilterType } from '@/services/headline'; // Renamed import
import type { HeadlineState, Category } from '@/services/headline';
import { Suspense } from 'react';
import { HeadlineTableSkeleton } from '@/components/headlines/headline-table-skeleton';
import { HeadlineFilters } from '@/components/headlines/headline-filters';
import { CreateHeadlineButton } from '@/components/headlines/create-headline-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchHeadlineInput } from '@/components/headlines/search-headline-input'; // Import search input

interface DashboardPageProps {
  searchParams: {
    page?: string;
    state?: HeadlineState;
    category?: string;
    search?: string; // Add search param
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentPage = Number(searchParams.page) || 1;
  const selectedState = searchParams.state;
  const selectedCategory = searchParams.category;
  const searchTerm = searchParams.search; // Get search term
  const pageSize = 10; // Define how many headlines per page

  const categories = await getCategories();

  // Pass filters to getHeadlines
  const filters: HeadlineFilterType = { // Use renamed type
    states: selectedState ? [selectedState] : undefined,
    category: selectedCategory,
    search: searchTerm, // Pass search term
  };

  // We pass the key to force re-render when searchParams change
  const tableKey = JSON.stringify(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Headlines Dashboard</h1>
        <CreateHeadlineButton categories={categories} /> {/* Pass categories to button */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter &amp; Search Headlines</CardTitle> {/* Updated title */}
        </CardHeader>
        <CardContent className="space-y-4"> {/* Add space-y-4 */}
           <HeadlineFilters categories={categories} />
           <SearchHeadlineInput /> {/* Add search input */}
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
  filters: HeadlineFilterType; // Use renamed type
  page: number;
  pageSize: number;
  categories: Category[];
}) {
  // Fetch headlines and total count
  const { headlines, totalCount } = await getHeadlines(filters, page, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <HeadlineTable
      headlines={headlines}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
