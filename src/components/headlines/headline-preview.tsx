
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { format } from 'date-fns'; // Import date-fns format function
import { Clock } from "lucide-react"; // Import Clock icon

interface HeadlinePreviewProps {
  mainTitle: string;
  subtitle: string;
  displayLines: number;
  isBreaking?: boolean;
  publishDate?: Date | null; // Add publishDate prop (optional)
}

export function HeadlinePreview({ mainTitle, subtitle, displayLines, isBreaking = false, publishDate }: HeadlinePreviewProps) {
  const { t } = useLanguage();

  // Map number to Tailwind class string literal
  const getLineClampClass = (lines: number) => {
    switch(lines) {
        case 1: return 'line-clamp-1';
        case 2: return 'line-clamp-2';
        case 3: return 'line-clamp-3';
        default: return 'line-clamp-2';
    }
  }

  // Format the publish date if available
  const formattedDate = publishDate instanceof Date && !isNaN(publishDate.getTime())
    ? format(publishDate, 'PPp') // Example format: Sep 14, 2024, 2:30 PM
    : null;

  return (
    <Card className="overflow-hidden flex flex-col h-full">
       <CardHeader className="p-4 pb-2">
            {isBreaking && (
                <Badge variant="destructive" className="mb-2 w-fit">{t('breakingNewsBadge')}</Badge>
            )}
           <CardTitle className={cn("text-xl font-bold leading-tight", getLineClampClass(displayLines))}>
             {mainTitle || t('mainTitlePreview')}
           </CardTitle>
       </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        {subtitle && (
          <p className={cn("text-sm text-muted-foreground mt-1", getLineClampClass(displayLines === 1 ? 1 : Math.max(1, 3 - displayLines)))}>
            {subtitle || t('subtitlePreview')}
          </p>
        )}
         {/* Add rich content preview if needed */}
      </CardContent>
       {/* Show formatted publish date in the footer */}
       {formattedDate && (
           <CardFooter className="p-4 pt-2 border-t mt-auto">
               <div className="flex items-center text-xs text-muted-foreground">
                   <Clock className="mr-1 h-3 w-3 rtl:ml-1 rtl:mr-0" />
                   <span>{formattedDate}</span>
               </div>
           </CardFooter>
       )}
    </Card>
  );
}
