'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClientFormattedDateProps {
  date: Date | string | number | null | undefined;
  formatString: string;
  placeholder?: string;
}

/**
 * A client component that safely formats a date only after hydration.
 * Prevents hydration mismatches caused by server/client timezone or locale differences.
 *
 * @param {ClientFormattedDateProps} props - Component props.
 * @param {Date | string | number | null | undefined} props.date - The date to format.
 * @param {string} props.formatString - The date-fns format string (e.g., 'PPp', 'yyyy-MM-dd').
 * @param {string} [props.placeholder='Loading...'] - Text to show before client-side rendering.
 * @returns {JSX.Element} The formatted date string or a placeholder.
 */
export function ClientFormattedDate({ date, formatString, placeholder = '...' }: ClientFormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client after hydration.
    if (date) {
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        // Ensure the date is valid before formatting
        if (!isNaN(dateObj.getTime())) {
          setFormattedDate(format(dateObj, formatString));
        } else {
          setFormattedDate('Invalid Date'); // Handle invalid date input
        }
      } catch (error) {
        console.error("Error formatting date:", error);
        setFormattedDate('Error'); // Indicate an error occurred
      }
    } else {
         setFormattedDate(''); // Handle null or undefined date input gracefully
    }
  }, [date, formatString]); // Re-run if the date or format string changes

  // Return the placeholder while waiting for client-side formatting,
  // or the formatted date once available.
  return <span>{formattedDate === null ? placeholder : formattedDate}</span>;
}