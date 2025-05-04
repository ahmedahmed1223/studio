

'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { HeadlineState } from '@/services/headline';

export type ExportFormat = 'csv' | 'txt';
export type TxtExportMode = 'single' | 'multiple'; // Note: 'multiple' might not be fully implemented in API yet
export const ALL_HEADLINE_STATES: HeadlineState[] = ['Draft', 'In Review', 'Approved', 'Archived'];

export type Theme = 'light' | 'dark' | 'custom';
export type FontSize = 'small' | 'medium' | 'large';
export type Font = 'Arial' | 'Helvetica' | 'Times New Roman' | 'Open Sans'; // Example font list


export interface ExportSettings {
  exportFormat: ExportFormat;
  txtExportMode: TxtExportMode;
  exportStates: HeadlineState[]; // Which headline states to include in the export
  theme: Theme;
  background: string; // HSL value for background color
  foreground: string; // HSL value for text color
  fontSize: FontSize;
  font: Font; // Selected font
}

interface SettingsContextProps {
  settings: ExportSettings;
  setSettings: (settings: Partial<ExportSettings>) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

const defaultSettings: ExportSettings = {
  exportFormat: 'csv',
  txtExportMode: 'single',
  exportStates: ['Approved'], // Default to exporting only 'Approved' headlines
  theme: 'light',
  background: '210 20% 98%', // Light Grey
  foreground: '210 10% 23%', // Dark Grey
  fontSize: 'medium',
  font: 'Arial',
};

// Helper to load settings from localStorage
const loadSettings = (): ExportSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings; // Return default if on server
  }
  try {
    const storedSettings = localStorage.getItem('headlineHubSettings');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Validate loaded settings - ensure states are valid HeadlineState[]
      if (Array.isArray(parsed.exportStates) && parsed.exportStates.every((s: any) => ALL_HEADLINE_STATES.includes(s))) {
         return { ...defaultSettings, ...parsed };
      }
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
  return defaultSettings;
};

// Helper to save settings to localStorage
const saveSettings = (settings: ExportSettings) => {
   if (typeof window !== 'undefined') {
       try {
           localStorage.setItem('headlineHubSettings', JSON.stringify(settings));
       } catch (error) {
           console.error('Error saving settings to localStorage:', error);
       }
   }
};


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<ExportSettings>(loadSettings);

  useEffect(() => {
    // Persist settings whenever they change
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((newSettings: Partial<ExportSettings>) => {
    setSettingsState((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

