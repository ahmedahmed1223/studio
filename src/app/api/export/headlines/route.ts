
import { NextRequest, NextResponse } from 'next/server';
import { getHeadlines, getCategories } from '@/services/headline'; // Adjust path as needed
import type { Headline, HeadlineState, Category, HeadlineFilters } from '@/services/headline'; // Import HeadlineFilters
import { format } from 'date-fns';


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
    'Publish Time',
    'Is Breaking', // Added header
    'Order', // Added header
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
    format(headline.publishDate, 'yyyy-MM-dd'),
    format(headline.publishDate, 'HH:mm'),
    headline.isBreaking ? 'Yes' : 'No', // Added value
    headline.order, // Added value
  ]);

  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

// Helper function to convert data to TXT format (single file)
function convertToTxtSingle(data: Headline[], categoryMap: Map<string, string>): string {
  return data.map(headline => `
Headline ID: ${headline.id}
Title: ${headline.mainTitle}
Subtitle: ${headline.subtitle}
Categories: ${headline.categories.map(catId => categoryMap.get(catId) || catId).join(', ')}
State: ${headline.state}
Priority: ${headline.priority}
Display Lines: ${headline.displayLines}
Publish Date: ${format(headline.publishDate, 'yyyy-MM-dd')}
Publish Time: ${format(headline.publishDate, 'HH:mm')}
Breaking News: ${headline.isBreaking ? 'Yes' : 'No'}
Order: ${headline.order}
-----------------------------------
  `).join('\n').trim();
}

// Placeholder for multiple file TXT export
// function convertToTxtMultiple(data: Headline[], categoryMap: Map<string, string>): ??? { ... }

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formatParam = (searchParams.get('format') || 'csv') as 'csv' | 'txt';
    const txtModeParam = (searchParams.get('txtMode') || 'single') as 'single' | 'multiple';
    const statesParam = searchParams.get('states');
    const searchParam = searchParams.get('search');
    const idsParam = searchParams.get('ids'); // Get specific IDs if present
    const isBreakingParam = searchParams.get('isBreaking'); // Optional: Filter by breaking status

    const exportIds = idsParam ? idsParam.split(',') : undefined;

    // Default states only apply if not exporting specific IDs
    const exportStates = !exportIds && statesParam
      ? statesParam.split(',').filter(s => ALL_HEADLINE_STATES.includes(s as HeadlineState)) as HeadlineState[]
      : (!exportIds ? ['Approved'] : undefined); // Default to 'Approved' only if no IDs and no states given

    if (!exportIds && (!exportStates || exportStates.length === 0)) {
      return new NextResponse('No valid states provided for export, and no specific IDs requested.', { status: 400 });
    }

     // Build filters for getHeadlines
     const filters: HeadlineFilters = {
         ids: exportIds,
         states: exportStates,
         search: searchParam || undefined,
         isBreaking: isBreakingParam !== null ? isBreakingParam === 'true' : undefined, // Convert string to boolean if present
     };

     // Fetch all matching headlines (no pagination for export)
     const { headlines } = await getHeadlines(filters, 0, 0);
     const categories = await getCategories();
     const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));


    let responseData: string;
    let contentType: string;
    let filename: string;
    const timestamp = format(new Date(), 'yyyyMMddHHmm');
    const baseFilename = exportIds ? `headlines_selection_${timestamp}` : `headlines_${(exportStates || ['all']).join('_')}_${timestamp}`;

    if (formatParam === 'txt') {
      if (txtModeParam === 'single') {
        responseData = convertToTxtSingle(headlines, categoryMap);
        contentType = 'text/plain; charset=utf-8';
        filename = `${baseFilename}.txt`;
      } else {
         return new NextResponse('Multiple file TXT export not yet implemented', { status: 501 });
        // responseData = convertToTxtMultiple(headlines, categoryMap); // Hypothetical
        // contentType = 'application/zip';
        // filename = `${baseFilename}.zip`;
      }
    } else { // Default to CSV
      responseData = convertToCSV(headlines, categoryMap);
      contentType = 'text/csv; charset=utf-8';
      filename = `${baseFilename}.csv`;
    }

    // Ensure filename is safe
    filename = filename.replace(/[^a-z0-9_.-]/gi, '_').replace(/__/g, '_');


    // Create a response with the data and appropriate headers
    const response = new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

    return response;

  } catch (error) {
    console.error('Failed to export headlines:', error);
    return new NextResponse('Failed to export data', { status: 500 });
  }
}

// Re-export ALL_HEADLINE_STATES for use in this file
export const ALL_HEADLINE_STATES: HeadlineState[] = ['Draft', 'In Review', 'Approved', 'Archived'];
