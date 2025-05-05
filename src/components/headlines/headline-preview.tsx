
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context"; // Import useLanguage

interface HeadlinePreviewProps {
  mainTitle: string;
  subtitle: string;
  displayLines: number;
  isBreaking?: boolean; // Add isBreaking prop
}

export function HeadlinePreview({ mainTitle, subtitle, displayLines, isBreaking = false }: HeadlinePreviewProps) {
  const { t } = useLanguage(); // Get translation function

  // Map number to Tailwind class string literal - necessary for JIT compilation
  const getLineClampClass = (lines: number) => {
    switch(lines) {
        case 1: return 'line-clamp-1';
        case 2: return 'line-clamp-2';
        case 3: return 'line-clamp-3';
        default: return 'line-clamp-2'; // Default to 2 lines
    }
  }

  return (
    <Card className="overflow-hidden">
       <CardHeader className="p-4 pb-2">
            {isBreaking && (
                <Badge variant="destructive" className="mb-2 w-fit">{t('breakingNewsBadge')}</Badge>
            )}
           <CardTitle className={cn("text-xl font-bold leading-tight", getLineClampClass(displayLines))}>
             {mainTitle || t('mainTitlePreview')} {/* Use translation */}
           </CardTitle>
       </CardHeader>
      <CardContent className="p-4 pt-0">
        {subtitle && (
          <p className={cn("text-sm text-muted-foreground mt-1", getLineClampClass(displayLines === 1 ? 1 : Math.max(1, 3 - displayLines)))}>
            {subtitle || t('subtitlePreview')} {/* Use translation */}
          </p>
        )}
         {/* Add rich content preview if needed */}
      </CardContent>
    </Card>
  );
}
