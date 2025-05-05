'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

/**
 * Defines the possible language codes supported by the application.
 */
type Language = 'en' | 'ar';

/**
 * Defines the possible text directions.
 */
type Direction = 'ltr' | 'rtl';

/**
 * Interface for the Language Context, providing language state and control functions.
 */
interface LanguageContextProps {
  /** The currently selected language code ('en' or 'ar'). */
  language: Language;
  /** The current text direction ('ltr' or 'rtl'). */
  direction: Direction;
  /** Function to set the application language and corresponding direction. */
  setLanguage: (lang: Language) => void;
  /** Function to toggle the text direction between 'ltr' and 'rtl'. */
  toggleDirection: () => void;
  /** Translation function to get localized strings. */
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * React Context for managing language and direction settings.
 */
const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

/**
 * Dictionary mapping language codes to their corresponding translation files.
 */
const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  ar: arTranslations,
};

/**
 * Provides the LanguageContext to its children components.
 * Manages the language and direction state, loading/saving preferences from localStorage,
 * and applying settings to the document element.
 */
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Arabic ('ar') and Right-to-Left ('rtl')
  const [language, setLanguageState] = useState<Language>('ar');
  const [direction, setDirection] = useState<Direction>('rtl');

  // Load language/direction preference from localStorage on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('appLanguage') as Language | null;
      const storedDir = localStorage.getItem('appDirection') as Direction | null;

      let initialLang: Language = 'ar'; // Default language
      let initialDir: Direction = 'rtl'; // Default direction

      // Use stored language if valid, otherwise use default
      if (storedLang && ['en', 'ar'].includes(storedLang)) {
        initialLang = storedLang;
        initialDir = storedLang === 'ar' ? 'rtl' : 'ltr'; // Base direction on stored language first
      }

      // Override direction if specifically stored and valid, otherwise use language-based default
      if (storedDir && ['ltr', 'rtl'].includes(storedDir)) {
        initialDir = storedDir;
      }

      // Apply initial settings
      setLanguageState(initialLang);
      setDirection(initialDir);
      document.documentElement.lang = initialLang;
      document.documentElement.dir = initialDir;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Sets the application language and updates the direction accordingly.
   * Saves the new settings to localStorage and updates the document element.
   * @param lang - The new language code ('en' or 'ar').
   */
  const setLanguage = useCallback((lang: Language) => {
    if (typeof window !== 'undefined') {
      setLanguageState(lang);
      const newDir = lang === 'ar' ? 'rtl' : 'ltr';
      setDirection(newDir);
      localStorage.setItem('appLanguage', lang);
      localStorage.setItem('appDirection', newDir); // Store direction tied to language change
      document.documentElement.lang = lang;
      document.documentElement.dir = newDir;
    }
  }, []);

  /**
   * Toggles the text direction between 'ltr' and 'rtl'.
   * Saves the new direction to localStorage and updates the document element.
   */
  const toggleDirection = useCallback(() => {
     if (typeof window !== 'undefined') {
       const newDirection = direction === 'ltr' ? 'rtl' : 'ltr';
       setDirection(newDirection);
       localStorage.setItem('appDirection', newDirection);
       document.documentElement.dir = newDirection;
     }
  }, [direction]);

  /**
   * Retrieves a translated string for the given key based on the current language.
   * Replaces placeholders (e.g., `{count}`) with provided parameter values.
   * Falls back to the key itself if the translation is not found.
   *
   * @param key - The translation key (from en.json or ar.json).
   * @param params - Optional object containing key-value pairs for placeholder replacement.
   * @returns The translated string or the original key if not found.
   */
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || key; // Fallback to key

    // Replace placeholders like {count}
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }

    return translation;
  }, [language]); // Dependency: re-run only when language changes


  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, toggleDirection, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to access the LanguageContext.
 * Throws an error if used outside of a LanguageProvider.
 * @returns The LanguageContextProps object containing language state and functions.
 */
export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

