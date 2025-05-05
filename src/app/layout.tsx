
'use client';

import React, { useEffect } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@hello-pangea/dnd/reset.css'; // Import dnd reset styles
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { SettingsProvider, useSettings } from '@/context/settings-context'; // Import useSettings
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Client component to apply dynamic attributes/styles to body/html
function HtmlBody({ children }: { children: React.ReactNode }) {
  const { language, direction } = useLanguage();
  const { settings } = useSettings(); // Get settings

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    // Apply theme class
    document.documentElement.classList.remove('light', 'dark');
    if (settings.theme !== 'custom') {
      document.documentElement.classList.add(settings.theme);
    }
    // Apply font size class
    document.body.classList.remove('text-sm', 'text-base', 'text-lg'); // Assuming Tailwind base is 'text-base'
    switch(settings.fontSize) {
        case 'small': document.body.classList.add('text-sm'); break;
        case 'large': document.body.classList.add('text-lg'); break;
        default: document.body.classList.add('text-base'); // Medium or default
    }
    // Apply font family style
    document.body.style.fontFamily = `${settings.font}, sans-serif`; // Add fallback

    // Apply custom colors using CSS variables (if theme is custom)
    if (settings.theme === 'custom') {
      // Ensure HSL values are correctly formatted for CSS
      // Basic validation/formatting can be added here
      document.documentElement.style.setProperty('--background', settings.background);
      document.documentElement.style.setProperty('--foreground', settings.foreground);
      // Reset other theme variables or define them based on background/foreground if needed
    } else {
       // Clear custom properties if not in custom theme
        document.documentElement.style.removeProperty('--background');
        document.documentElement.style.removeProperty('--foreground');
    }

  }, [language, direction, settings]); // Rerun effect when language, direction, or settings change

  return (
    // Use cn for base classes + inter variable, dynamic classes/styles applied via useEffect
    <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
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
      <SettingsProvider>
        {/* No need for static lang/dir on <html> - handled by effect in HtmlBody */}
        <html>
            <HtmlBody>
                {children}
            </HtmlBody>
        </html>
      </SettingsProvider>
    </LanguageProvider>
  );
}
