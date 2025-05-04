import { NextResponse } from 'next/server';
import { getHeadlines, getCategories } from '@/services/headline'; // Adjust path as needed
import type { Headline } from '@/services/headline';

// Helper function to convert data to CSV format
function convertToCSV(data: Headline[], categoryMap: Map<string, string>): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Main Title',
    'Subtitle',
    'Categories',
    'State',
    'Priority',
    'Display Lines',
    'Publish Date',
  ];

  // Map data to CSV rows
  const rows = data.map(headline => [
    headline.id,
    `"${headline.mainTitle.replace(/"/g, '""')}"`, // Escape double quotes
    `"${headline.subtitle.replace(/"/g, '""')}"`,
    `"${headline.categories.map(catId => categoryMap.get(catId) || catId).join(', ')}"`, // Map IDs to names
    headline.state,
    headline.priority,
    headline.displayLines,
    headline.publishDate.toISOString(), // Format date as ISO string
  ]);

  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

export async function GET() {
  try {
    // Fetch all headlines (no pagination or filtering for export)
    // Adjust getHeadlines if needed to support fetching all data
    // This might be inefficient for large datasets. Consider streaming or background jobs.
    const headlines = await getHeadlines(undefined, 1, 1000); // Fetch up to 1000 headlines
    const categories = await getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    // Convert headlines data to CSV format
    const csvData = convertToCSV(headlines, categoryMap);

    // Create a response with CSV data and appropriate headers
    const response = new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="headlines.csv"', // Suggest filename for download
      },
    });

    return response;

  } catch (error) {
    console.error('Failed to export headlines:', error);
    return new NextResponse('Failed to export data', { status: 500 });
  }
}
