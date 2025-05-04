'use client'; // Make this a client component to use the hook

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a modern feel
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider, useLanguage } from '@/context/language-context'; // Import useLanguage
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useEffect } from 'react'; // Import useEffect directly

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Note: Metadata defined here might not be fully dynamic based on language/direction
// if the entire layout is client-rendered. Consider alternative approaches if needed.
// export const metadata: Metadata = {
//   title: 'Headline Hub',
//   description: 'Manage your headlines efficiently.',
// };

// Inner component to consume context and apply to HTML tag
function HtmlBody({ children }: { children: React.ReactNode }) {
  const { language, direction } = useLanguage();

  // Apply lang/dir to HTML tag via useEffect, as we can't directly modify it here easily
  // in a Client Component wrapping the entire structure.
  // This ensures the attributes are set after mount.
  useEffect(() => { // Use imported useEffect
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  return (
    <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        {/* Footer can be added here if needed */}
      </div>
      <Toaster />
    </body>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
        {/* The LanguageProvider now wraps the content directly */}
        {/* We need a client component *inside* the provider to use the hook */}
        {/* We still need the <html> tag */}
        <html>
            {/*
                The `lang` and `dir` attributes will be set by the HtmlBody component's effect.
                Setting initial static values might cause hydration mismatches if localStorage differs.
                Letting the effect handle it is safer for client components modifying the root HTML element.
            */}
            <HtmlBody>
                {children}
            </HtmlBody>
        </html>
    </LanguageProvider>
  );
}
