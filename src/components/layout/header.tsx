
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Languages, AlignRight, AlignLeft, Settings, LogOut, Download, Newspaper, AlertTriangle } from 'lucide-react'; // Added Newspaper, AlertTriangle
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';


export function Header() {
  const { language, direction, setLanguage, toggleDirection, t } = useLanguage();
  const { settings } = useSettings();
  const router = useRouter();

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setLanguage(lang);
  };

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log("Logout clicked");
    // router.push('/login');
  };

   // Generate the dynamic export URL based on settings (for bulk export from settings)
   const exportUrl = useMemo(() => {
       const params = new URLSearchParams();
       params.set('format', settings.exportFormat);
       if (settings.exportFormat === 'txt') {
           params.set('txtMode', settings.txtExportMode);
       }
       // Export specific states defined in settings for this button
       if (settings.exportStates.length > 0) {
            params.set('states', settings.exportStates.join(','));
       }
       // Optionally add isBreaking=false filter here if this should only export regular news
       // params.set('isBreaking', 'false');

       return `/api/export/headlines?${params.toString()}`;
   }, [settings]);

  const exportFilename = useMemo(() => {
      const stateString = settings.exportStates.length > 0
        ? settings.exportStates.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '_')
        : 'all_states';
      const extension = settings.exportFormat;
      return `headlines_${stateString}.${extension}`;
   }, [settings.exportFormat, settings.exportStates]);


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2 rtl:ml-6 rtl:mr-0">
           {/* Logo */}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
             <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.4 3.4 0 0 0 8 7c0 1.1.4 2.1 1 2.9 1.6 2.1 4.2 4.1 5 5.1.8-1 3.4-3 5-5.1.6-.8 1-1.8 1-2.9a3.4 3.4 0 0 0-1-2.3C14.4 3.6 13.2 3 12 3z"/>
             <path d="M4 21h16"/>
             <path d="M7 12v9"/>
             <path d="M17 12v9"/>
           </svg>
          <span className="font-bold">{t('headlineHub')}</span>
        </Link>

        {/* Main Navigation Links */}
        <nav className="hidden md:flex items-center space-x-4 rtl:space-x-reverse text-sm font-medium">
            <Link href="/dashboard" className="text-foreground/70 hover:text-foreground transition-colors">
                {t('dashboard')}
            </Link>
             <Link href="/breaking-news" className="text-foreground/70 hover:text-foreground transition-colors">
                {t('breakingNews')} <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">{t('breakingNewsBadge')}</Badge>
            </Link>
             {/* Add other main navigation items here if needed */}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 rtl:space-x-reverse">
           {/* Language Switcher */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                    <span className="sr-only">{t('changeLanguage')}</span>
                 </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => handleLanguageChange('en')} disabled={language === 'en'}>
                 English
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleLanguageChange('ar')} disabled={language === 'ar'}>
                 العربية
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>

            {/* Direction Toggle */}
           <Button variant="ghost" size="icon" onClick={toggleDirection} title={t('toggleDirection')}>
                {direction === 'rtl' ? <AlignLeft className="h-5 w-5" /> : <AlignRight className="h-5 w-5" />}
                <span className="sr-only">{t('toggleDirection')}</span>
           </Button>

           {/* Settings/Profile/Mobile Menu Dropdown */}
            <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{t('userSettings')}</span>
                 </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
                 {/* Navigation items for mobile */}
                 <DropdownMenuItem onClick={() => router.push('/dashboard')} className="md:hidden">
                   <Newspaper className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  <span>{t('dashboard')}</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/breaking-news')} className="md:hidden">
                   <AlertTriangle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 text-destructive" />
                  <span>{t('breakingNews')}</span>
                </DropdownMenuItem>
                 <DropdownMenuSeparator className="md:hidden" />

                 {/* Common items */}
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                   <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  <span>{t('settings')}</span>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <a href={exportUrl} download={exportFilename}>
                        <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        <span>{t('exportData')} ({t('basedOnSettings')})</span>
                    </a>
                 </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
