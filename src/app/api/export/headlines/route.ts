
import { NextRequest, NextResponse } from 'next/server';
import { getHeadlines, getCategories } from '@/services/headline'; // Adjust path as needed
import type { Headline, HeadlineState, Category, HeadlineFilters } from '@/services/headline'; // Import HeadlineFilters
import { format } from 'date-fns';

/**
 * Converts an array of Headline objects to a CSV formatted string.
 * Maps category IDs to names using the provided categoryMap.
 *
 * @param data - Array of Headline objects to convert.
 * @param categoryMap - A Map where keys are category IDs and values are category names.
 * @returns A string containing the CSV data, including headers. Returns an empty string if data is empty.
 */
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

/**
 * Converts an array of Headline objects to a plain text formatted string (single file).
 * Each headline's details are separated by a line of dashes.
 * Maps category IDs to names using the provided categoryMap.
 *
 * @param data - Array of Headline objects to convert.
 * @param categoryMap - A Map where keys are category IDs and values are category names.
 * @returns A string containing the formatted text data for all headlines.
 */
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

/**
 * Handles GET requests to the /api/export/headlines endpoint.
 * Fetches headlines based on query parameters (format, states, search, ids, isBreaking)
 * and returns the data in the specified format (CSV or TXT).
 *
 * Query Parameters:
 * - format: 'csv' (default) or 'txt'.
 * - txtMode: 'single' (default) or 'multiple'. Currently, only 'single' is fully supported.
 * - states: Comma-separated list of HeadlineState values to include (e.g., "Approved,In Review"). Defaults to 'Approved' if neither states nor ids are provided.
 * - search: A search term to filter headlines by title or subtitle.
 * - ids: Comma-separated list of specific headline IDs to export. If provided, 'states' filter is ignored.
 * - isBreaking: 'true' or 'false' to filter by breaking news status.
 *
 * @param request - The NextRequest object containing query parameters.
 * @returns A NextResponse object with the exported data as the body and appropriate headers for download.
 */
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

    // Determine states to export. Default to 'Approved' only if not exporting specific IDs and no states are provided.
    const exportStates = !exportIds && statesParam
      ? statesParam.split(',').filter(s => ALL_HEADLINE_STATES.includes(s as HeadlineState)) as HeadlineState[]
      : (!exportIds ? ['Approved'] : undefined);

    // Validate that if we are not exporting by ID, we have valid states to export.
    if (!exportIds && (!exportStates || exportStates.length === 0)) {
      return new NextResponse('No valid states provided for export, and no specific IDs requested.', { status: 400 });
    }

     // Build filters for the getHeadlines service call.
     const filters: HeadlineFilters = {
         ids: exportIds,
         states: exportStates,
         search: searchParam || undefined,
         isBreaking: isBreakingParam !== null ? isBreakingParam === 'true' : undefined, // Convert string to boolean if present
     };

     // Fetch all matching headlines (no pagination needed for export).
     // Fetch categories to map IDs to names.
     const { headlines } = await getHeadlines(filters, 0, 0); // page=0, pageSize=0 means fetch all
     const categories = await getCategories();
     const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));


    let responseData: string;
    let contentType: string;
    let filename: string;
    const timestamp = format(new Date(), 'yyyyMMddHHmm');
    // Construct a base filename indicating what was exported.
    const baseFilename = exportIds
        ? `headlines_selection_${timestamp}`
        : `headlines_${(exportStates || ['all']).join('_')}_${timestamp}`;

    // Generate response based on format and txtMode.
    if (formatParam === 'txt') {
      if (txtModeParam === 'single') {
        responseData = convertToTxtSingle(headlines, categoryMap);
        contentType = 'text/plain; charset=utf-8';
        filename = `${baseFilename}.txt`;
      } else {
         // 'multiple' file export is not implemented yet.
         return new NextResponse('Multiple file TXT export not yet implemented', { status: 501 });
        // Example placeholder for future implementation:
        // responseData = convertToTxtMultiple(headlines, categoryMap); // Hypothetical function returning zip data
        // contentType = 'application/zip';
        // filename = `${baseFilename}.zip`;
      }
    } else { // Default to CSV
      responseData = convertToCSV(headlines, categoryMap);
      contentType = 'text/csv; charset=utf-8';
      filename = `${baseFilename}.csv`;
    }

    // Sanitize filename to prevent issues.
    filename = filename.replace(/[^a-z0-9_.-]/gi, '_').replace(/__/g, '_');


    // Create the NextResponse with the generated data and download headers.
    const response = new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0', // Prevent caching of the export file
      },
    });

    return response;

  } catch (error) {
    console.error('Failed to export headlines:', error);
    return new NextResponse('Internal Server Error: Failed to export data', { status: 500 });
  }
}

/**
 * Array containing all possible headline states. Used for validation.
 */
export const ALL_HEADLINE_STATES: HeadlineState[] = ['Draft', 'In Review', 'Approved', 'Archived'];

