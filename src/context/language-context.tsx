'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextProps {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleDirection: () => void;
  t: (key: string, params?: Record<string, string | number>) => string; // Translation function
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  ar: arTranslations,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en'); // Default to English
  const [direction, setDirection] = useState<Direction>('ltr'); // Default to LTR

  // Load language/direction preference from localStorage on mount
  useEffect(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    const storedDir = localStorage.getItem('appDirection') as Direction | null;

    let initialLang = 'en' as Language;
    let initialDir = 'ltr' as Direction;

    if (storedLang && ['en', 'ar'].includes(storedLang)) {
      initialLang = storedLang;
      initialDir = storedLang === 'ar' ? 'rtl' : 'ltr'; // Set direction based on stored language first
    } else {
       // Optionally detect browser language preference here
       // For now, stick with 'en'/'ltr' default
    }

    // Override direction if specifically stored
    if (storedDir && ['ltr', 'rtl'].includes(storedDir)) {
      initialDir = storedDir;
    }

    setLanguageState(initialLang);
    setDirection(initialDir);
    // Apply initial settings to the document element
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialDir;


  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    const newDir = lang === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDir);
    localStorage.setItem('appLanguage', lang);
    localStorage.setItem('appDirection', newDir); // Also store direction tied to language change
    document.documentElement.lang = lang;
    document.documentElement.dir = newDir;
  };

  const toggleDirection = () => {
    const newDirection = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    localStorage.setItem('appDirection', newDirection);
    document.documentElement.dir = newDirection;
  };

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || key; // Fallback to key if translation not found

    // Replace placeholders like {count}
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }

    return translation;
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, toggleDirection, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
