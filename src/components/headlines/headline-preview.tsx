'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeadlinePreviewProps {
  mainTitle: string;
  subtitle: string;
  displayLines: number;
}

export function HeadlinePreview({ mainTitle, subtitle, displayLines }: HeadlinePreviewProps) {
  const lineClampClass = `line-clamp-${displayLines}`; // Tailwind JIT needs full class names

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
      <CardContent className="p-4">
        <h4 className={cn("text-xl font-bold leading-tight", getLineClampClass(displayLines))}>
          {mainTitle || "Main Title Preview"}
        </h4>
        {subtitle && (
          <p className={cn("text-sm text-muted-foreground mt-1", getLineClampClass(displayLines === 1 ? 1 : 3 - displayLines))}>
            {subtitle || "Subtitle preview goes here."}
          </p>
        )}
         {/* Add more preview elements as needed, e.g., image placeholder */}
      </CardContent>
       {/* Optionally add a CardFooter for more preview details */}
    </Card>
  );
}
