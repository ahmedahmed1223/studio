'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Languages, AlignRight, AlignLeft, Settings, LogOut } from 'lucide-react'; // Updated icons
import { useLanguage } from '@/context/language-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation'; // To handle logout redirect

export function Header() {
  const { language, direction, setLanguage, toggleDirection, t } = useLanguage();
  const router = useRouter();

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setLanguage(lang);
  };

  const handleLogout = () => {
    // TODO: Implement actual logout logic (e.g., clear token, call API)
    console.log("Logout clicked");
    // Redirect to login page after logout
    // router.push('/login'); // Assuming a login page exists at /login
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2 rtl:ml-6 rtl:mr-0">
          {/* Replace with SVG logo if available */}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
             <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.4 3.4 0 0 0 8 7c0 1.1.4 2.1 1 2.9 1.6 2.1 4.2 4.1 5 5.1.8-1 3.4-3 5-5.1.6-.8 1-1.8 1-2.9a3.4 3.4 0 0 0-1-2.3C14.4 3.6 13.2 3 12 3z"/>
             <path d="M4 21h16"/>
             <path d="M7 12v9"/>
             <path d="M17 12v9"/>
           </svg>
          <span className="font-bold">{t('headlineHub')}</span>
        </Link>
        <nav className="flex flex-1 items-center justify-end space-x-2 rtl:space-x-reverse">
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
                {/* Use AlignLeft for LTR, AlignRight for RTL */}
                {direction === 'rtl' ? <AlignLeft className="h-5 w-5" /> : <AlignRight className="h-5 w-5" />}
                <span className="sr-only">{t('toggleDirection')}</span>
           </Button>

           {/* User Settings/Profile Dropdown */}
            <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{t('userSettings')}</span>
                 </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push('/settings')}> {/* Assuming /settings page */}
                   <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  <span>{t('settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 text-destructive rtl:ml-2 rtl:mr-0" />
                  <span className="text-destructive">{t('logout')}</span>
                </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>

        </nav>
      </div>
    </header>
  );
}
