
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, ExportFormat, TxtExportMode, ALL_HEADLINE_STATES, Theme, FontSize, Font } from "@/context/settings-context";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import type { HeadlineState } from '@/services/headline';
// Removed direct import of getCategories from service
// import { getCategories } from '@/services/headline';
import { CategoryManager } from "@/components/settings/category-manager";
// Removed useState, useEffect, Skeleton related to direct category fetching here
// import { useState, useEffect } from "react";
// import { Skeleton } from "@/components/ui/skeleton";


/**
 * @fileoverview Settings page component for configuring application preferences.
 * Allows users to manage categories, customize display settings (theme, font, colors),
 * and configure data export options.
 */
export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { t } = useLanguage();
  const { toast } = useToast();
  // Removed state related to direct category fetching
  // const [categories, setCategories] = useState<Category[]>([]);
  // const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  // const [categoryError, setCategoryError] = useState<string | null>(null);


  // Removed useEffect for fetching categories directly in this component
   // // Fetch categories on mount
   // useEffect(() => {
   //     const fetchCategories = async () => {
   //         setIsLoadingCategories(true);
   //         setCategoryError(null);
   //         try {
   //             const fetchedCategories = await getCategories(); // Removed direct call
   //             setCategories(fetchedCategories);
   //         } catch (error) {
   //             console.error("Failed to fetch categories:", error);
   //             setCategoryError(t('categoryFetchError')); // Use translation
   //             toast({
   //                title: t('error'),
   //                description: t('categoryFetchError'),
   //                variant: 'destructive'
   //             });
   //         } finally {
   //             setIsLoadingCategories(false);
   //         }
   //     };
   //     fetchCategories();
   // }, [t, toast]); // Add t and toast as dependencies


  const handleFormatChange = (value: string) => {
    setSettings({ exportFormat: value as ExportFormat });
  };

  const handleTxtModeChange = (value: string) => {
    setSettings({ txtExportMode: value as TxtExportMode });
  };

   const handleStateChange = (state: HeadlineState, checked: boolean | 'indeterminate') => {
       const currentStates = settings.exportStates;
       let newStates: HeadlineState[];

       if (checked === true) {
           newStates = [...currentStates, state];
       } else {
           newStates = currentStates.filter(s => s !== state);
       }

       // Prevent unchecking all states
       if (newStates.length > 0) {
            setSettings({ exportStates: newStates });
       } else {
           toast({
               title: t('error'),
               description: t('atLeastOneStateRequired'),
               variant: 'destructive'
           })
       }
   };

    const handleThemeChange = (value: string) => {
        setSettings({ theme: value as Theme });
    };

    const handleFontSizeChange = (value: string) => {
        setSettings({ fontSize: value as FontSize });
    };

    const handleFontChange = (value: string) => {
        setSettings({ font: value as Font });
    };

    const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ background: e.target.value });
    };

    const handleForegroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ foreground: e.target.value });
    };

  const handleSave = () => {
    // Settings are saved automatically via context/localStorage, but provide feedback
    toast({
      title: t('settingsSavedTitle'),
      description: t('settingsSavedDesc'),
    });
  };

  // Note: refreshCategories function is now handled within CategoryManager itself


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>

       {/* Category Management Card - Now fetches its own data */}
      <Card>
        <CardHeader>
          <CardTitle>{t('manageCategories')}</CardTitle>
          <CardDescription>{t('manageCategoriesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Pass initial empty array or let CategoryManager handle loading state */}
            <CategoryManager />
        </CardContent>
      </Card>

       {/* Display Settings Card */}
        <Card>
            <CardHeader>
                <CardTitle>{t('displaySettings')}</CardTitle>
                <CardDescription>{t('displaySettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Theme */}
                <div className="space-y-2">
                    <Label>{t('theme')}</Label>
                    <RadioGroup value={settings.theme} onValueChange={handleThemeChange} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="theme-light" />
                            <Label htmlFor="theme-light" className="font-normal">{t('light')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dark" id="theme-dark" />
                            <Label htmlFor="theme-dark" className="font-normal">{t('dark')}</Label>
                        </div>
                         {/* Custom theme is managed via color pickers below */}
                         {/* <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="theme-custom" />
                            <Label htmlFor="theme-custom" className="font-normal">{t('custom')}</Label>
                        </div> */}
                    </RadioGroup>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                    <Label>{t('fontSize')}</Label>
                    <RadioGroup value={settings.fontSize} onValueChange={handleFontSizeChange} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="small" id="fontSize-small" />
                            <Label htmlFor="fontSize-small" className="font-normal">{t('small')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="medium" id="fontSize-medium" />
                            <Label htmlFor="fontSize-medium" className="font-normal">{t('medium')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="large" id="fontSize-large" />
                            <Label htmlFor="fontSize-large" className="font-normal">{t('large')}</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Font Selection */}
                <div className="space-y-2">
                    <Label>{t('fontFamily')}</Label>
                    <Select value={settings.font} onValueChange={handleFontChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('selectFont')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Arial">{t('Arial')}</SelectItem>
                            <SelectItem value="Helvetica">{t('Helvetica')}</SelectItem>
                            <SelectItem value="Times New Roman">{t('TimesNewRoman')}</SelectItem>
                            <SelectItem value="Open Sans">{t('OpenSans')}</SelectItem>
                            {/* Add more fonts if needed */}
                        </SelectContent>
                    </Select>
                </div>

                {/* Custom Colors */}
                {/* Consider showing these only if theme is 'custom' or linking them */}
                <div className="space-y-2 border-t pt-4 mt-4">
                    <Label className="font-semibold">{t('customColors')}</Label>
                     <p className="text-sm text-muted-foreground">{t('customColorsDesc')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="backgroundColor">{t('backgroundColor')}</Label>
                            <Input id="backgroundColor" type="text" value={settings.background} onChange={handleBackgroundColorChange} placeholder="e.g., 210 20% 98%" />
                        </div>
                        <div>
                            <Label htmlFor="foregroundColor">{t('foregroundColor')}</Label>
                            <Input id="foregroundColor" type="text" value={settings.foreground} onChange={handleForegroundColorChange} placeholder="e.g., 210 10% 23%" />
                        </div>
                    </div>
                     <p className="text-xs text-muted-foreground pt-2">{t('hslFormatHint')}</p>
                </div>
            </CardContent>
        </Card>

      {/* Export Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('exportSettings')}</CardTitle>
          <CardDescription>{t('exportSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>{t('exportFormat')}</Label>
            <RadioGroup
              value={settings.exportFormat}
              onValueChange={handleFormatChange}
              className="flex space-x-4 rtl:space-x-reverse"
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="font-normal">CSV (.csv)</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="txt" id="format-txt" />
                <Label htmlFor="format-txt" className="font-normal">Text (.txt)</Label>
              </div>
               {/* Add Excel/XLSX option later if needed */}
            </RadioGroup>
          </div>

          {/* TXT Export Mode (conditional) */}
          {settings.exportFormat === 'txt' && (
            <div className="space-y-2 pl-4 border-l-2 border-muted ml-1 rtl:pr-4 rtl:border-r-2 rtl:border-l-0 rtl:mr-1 rtl:ml-0">
              <Label>{t('txtExportMode')}</Label>
               <RadioGroup
                  value={settings.txtExportMode}
                  onValueChange={handleTxtModeChange}
                  className="flex space-x-4 rtl:space-x-reverse"
              >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="single" id="txtmode-single" />
                      <Label htmlFor="txtmode-single" className="font-normal">{t('txtSingleFile')}</Label>
                  </div>
                  {/* Multiple file export option (currently disabled in API) */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="multiple" id="txtmode-multiple" disabled />
                      <Label htmlFor="txtmode-multiple" className="font-normal text-muted-foreground">
                          {t('txtMultipleFiles')} ({t('comingSoon')})
                      </Label>
                  </div>
              </RadioGroup>
            </div>
          )}

           {/* Export States */}
           <div className="space-y-2">
             <Label>{t('exportStates')}</Label>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {ALL_HEADLINE_STATES.map((state) => (
                 <div key={state} className="flex items-center space-x-2 rtl:space-x-reverse">
                     <Checkbox
                         id={`state-${state}`}
                         checked={settings.exportStates.includes(state)}
                         onCheckedChange={(checked) => handleStateChange(state, checked)}
                         aria-labelledby={`label-state-${state}`}
                     />
                     <Label htmlFor={`state-${state}`} id={`label-state-${state}`} className="font-normal">
                         {t(state.toLowerCase().replace(' ', ''))}
                     </Label>
                 </div>
                 ))}
             </div>
           </div>

        </CardContent>
         <CardFooter>
           {/* Save button might not be strictly necessary if settings save on change, but good UX */}
           <Button onClick={handleSave}>{t('saveSettings')}</Button>
         </CardFooter>
      </Card>


    </div>
  );
}
