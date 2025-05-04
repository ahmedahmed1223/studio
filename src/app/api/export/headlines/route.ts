
import { NextRequest, NextResponse } from 'next/server';
import { getHeadlines, getCategories } from '@/services/headline'; // Adjust path as needed
import type { Headline, HeadlineState, Category } from '@/services/headline';
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
-----------------------------------
  `).join('\n').trim();
}

// TODO: Implement convertToTxtMultiple if needed (requires zipping files or similar)
// function convertToTxtMultiple(data: Headline[], categoryMap: Map<string, string>): ??? {
//   // This would likely involve creating multiple file contents and potentially zipping them.
//   // The response format would need careful consideration (e.g., zip file).
// }

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formatParam = (searchParams.get('format') || 'csv') as 'csv' | 'txt';
    const txtModeParam = (searchParams.get('txtMode') || 'single') as 'single' | 'multiple';
    const statesParam = searchParams.get('states'); // Comma-separated list of states
    const searchParam = searchParams.get('search'); // Get search term if present

    const exportStates = statesParam
      ? statesParam.split(',').filter(s => ALL_HEADLINE_STATES.includes(s as HeadlineState)) as HeadlineState[]
      : ['Approved']; // Default to 'Approved' if not specified or invalid

    if (exportStates.length === 0) {
      return new NextResponse('No valid states provided for export', { status: 400 });
    }

     // Fetch all headlines matching the specified states and search term (no pagination for export)
     const filters = {
       states: exportStates,
       search: searchParam || undefined, // Pass search term
     };
     const { headlines, totalCount } = await getHeadlines(filters, 0, 0); // Fetch all matching
     const categories = await getCategories();
     const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));


    let responseData: string;
    let contentType: string;
    let filename: string;

    if (formatParam === 'txt') {
      if (txtModeParam === 'single') {
        responseData = convertToTxtSingle(headlines, categoryMap);
        contentType = 'text/plain; charset=utf-8';
        filename = `headlines_${exportStates.join('_')}.txt`;
      } else {
        // Placeholder for multiple file export (e.g., zip)
         return new NextResponse('Multiple file TXT export not yet implemented', { status: 501 });
        // responseData = convertToTxtMultiple(headlines, categoryMap); // Hypothetical
        // contentType = 'application/zip';
        // filename = `headlines_${exportStates.join('_')}.zip`;
      }
    } else { // Default to CSV
      responseData = convertToCSV(headlines, categoryMap);
      contentType = 'text/csv; charset=utf-8';
      filename = `headlines_${exportStates.join('_')}.csv`;
    }

    // Ensure filename is safe
    filename = filename.replace(/[^a-z0-9_.-]/gi, '_');


    // Create a response with the data and appropriate headers
    const response = new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`, // Suggest filename for download
         // Add cache control headers to prevent caching of dynamic exports
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
