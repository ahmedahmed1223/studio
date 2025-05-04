
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useSettings, ExportFormat, TxtExportMode, ALL_HEADLINE_STATES } from "@/context/settings-context";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import type { HeadlineState, Category } from "@/services/headline";
import { getCategories } from '@/services/headline'; // Import getCategories
import { CategoryManager } from "@/components/settings/category-manager"; // Import CategoryManager
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);


   // Fetch categories on mount
   useEffect(() => {
       const fetchCategories = async () => {
           setIsLoadingCategories(true);
           setCategoryError(null);
           try {
               const fetchedCategories = await getCategories();
               setCategories(fetchedCategories);
           } catch (error) {
               console.error("Failed to fetch categories:", error);
               setCategoryError(t('categoryFetchError')); // Use translation
               toast({
                  title: t('error'),
                  description: t('categoryFetchError'),
                  variant: 'destructive'
               });
           } finally {
               setIsLoadingCategories(false);
           }
       };
       fetchCategories();
   }, [t, toast]); // Add t and toast as dependencies


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

  const handleSave = () => {
    // Settings are saved automatically via context/localStorage, but provide feedback
    toast({
      title: t('settingsSavedTitle'),
      description: t('settingsSavedDesc'),
    });
  };

  // Function to refresh categories list, passed down to CategoryManager
  const refreshCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      try {
          const fetchedCategories = await getCategories();
          setCategories(fetchedCategories);
      } catch (error) {
          console.error("Failed to refresh categories:", error);
          setCategoryError(t('categoryFetchError'));
      } finally {
          setIsLoadingCategories(false);
      }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>

       {/* Category Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('manageCategories')}</CardTitle>
          <CardDescription>{t('manageCategoriesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : categoryError ? (
             <p className="text-destructive">{categoryError}</p>
          ) : (
            <CategoryManager categories={categories} onCategoriesUpdate={refreshCategories} />
          )}
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
                  {/* <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="multiple" id="txtmode-multiple" disabled />
                      <Label htmlFor="txtmode-multiple" className="font-normal text-muted-foreground">{t('txtMultipleFiles')} ({t('comingSoon')})</Label>
                  </div> */}
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
