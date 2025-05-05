
'use client';

import React, { useState, useEffect } from 'react'; // Import React explicitly
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Headline, Category, HeadlineState, HeadlinePriority } from '@/services/headline';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createHeadlineAction, updateHeadlineAction } from '@/actions/headline-actions';
import { useToast } from '@/hooks/use-toast';
import { HeadlinePreview } from './headline-preview';
import { useLanguage } from '@/context/language-context';

// Placeholder for a rich text editor component
// Replace this with an actual rich text editor integration (e.g., Tiptap, Quill, Slate)
const RichTextEditor = ({ value, onChange, ...props }: { value: string; onChange: (value: string) => void; [key: string]: any }) => {
    // Basic textarea for now, add spellCheck attribute
    return (
        <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
            spellCheck="true" // Enable browser's spell checker
            className="min-h-[150px]" // Give it more height
        />
    );
};


interface HeadlineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  headline?: (Headline & { publishDate: Date }) | null; // Expect Date object for editing
  categories: Category[];
  isBreaking?: boolean; // Optional: Default value for the breaking news checkbox
}

// Zod schema expects Date object for publishDate
const headlineSchema = z.object({
  mainTitle: z.string().min(1, { message: "Main title is required" }),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, { message: "At least one category is required" }),
  state: z.enum(['Draft', 'In Review', 'Approved', 'Archived']),
  priority: z.enum(['High', 'Normal']),
  displayLines: z.number().min(1).max(3),
  publishDate: z.date({ required_error: "Publish date is required" }),
  publishTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)" }), // Make time required
  isBreaking: z.boolean().default(false),
});

type HeadlineFormData = z.infer<typeof headlineSchema>;

export function HeadlineEditorModal({ isOpen, onClose, headline, categories, isBreaking: initialIsBreaking = false }: HeadlineEditorModalProps) {
  const isEditing = !!headline;
  const { toast } = useToast();
  const { t } = useLanguage();

  // Function to get default date/time values
  const getDefaultDateTime = (): { date: Date; time: string } => {
      const date = headline?.publishDate ? new Date(headline.publishDate) : new Date();
      // Ensure date is valid before formatting
      const time = !isNaN(date.getTime()) ? format(date, 'HH:mm') : format(new Date(), 'HH:mm');
      return { date: !isNaN(date.getTime()) ? date : new Date(), time };
  };

  const [selectedTime, setSelectedTime] = useState<string>(getDefaultDateTime().time);


  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
  } = useForm<HeadlineFormData>({
    resolver: zodResolver(headlineSchema),
    defaultValues: {
      mainTitle: headline?.mainTitle || '',
      subtitle: headline?.subtitle || '',
      content: '', // Initialize rich text content (load if editing)
      categoryIds: headline?.categories || [],
      state: headline?.state || 'Draft',
      priority: headline?.priority || 'Normal',
      displayLines: headline?.displayLines || 2,
      publishDate: getDefaultDateTime().date, // Use function for default date
      publishTime: getDefaultDateTime().time, // Use function for default time
      isBreaking: headline?.isBreaking ?? initialIsBreaking,
    },
  });

   // Watch form values for preview
  const watchedValues = watch();

  // Reset form when modal opens or headline/initialIsBreaking changes
  useEffect(() => {
    if (isOpen) {
        const { date: defaultDate, time: defaultTime } = getDefaultDateTime();
        reset({
            mainTitle: headline?.mainTitle || '',
            subtitle: headline?.subtitle || '',
            content: '', // Reset/load content for editing
            categoryIds: headline?.categories || [],
            state: headline?.state || 'Draft',
            priority: headline?.priority || 'Normal',
            displayLines: headline?.displayLines || 2,
            publishDate: defaultDate, // Use Date object
            publishTime: defaultTime, // Use HH:mm string
            isBreaking: headline?.isBreaking ?? initialIsBreaking,
        });
        setSelectedTime(defaultTime); // Also reset local time state
    }
  }, [isOpen, headline, reset, initialIsBreaking]);


  const onSubmit = async (data: HeadlineFormData) => {
    try {
      // Combine date and time into a single Date object
      const combinedDateTime = new Date(data.publishDate);
      const [hours, minutes] = (data.publishTime).split(':').map(Number);
       if (!isNaN(hours) && !isNaN(minutes)) {
         combinedDateTime.setHours(hours, minutes, 0, 0);
       } else {
          // Handle invalid time format if needed, though zod should prevent this
          console.error("Invalid time format submitted:", data.publishTime);
          toast({ title: t('error'), description: "Invalid time format.", variant: "destructive" });
          return;
       }

      // Data to send to the action (expects Date object for publishDate)
      const headlineData = {
          mainTitle: data.mainTitle,
          subtitle: data.subtitle || '',
          // content: data.content || '', // Include rich text content if editor implemented
          categories: data.categoryIds,
          state: data.state,
          priority: data.priority,
          displayLines: data.displayLines,
          publishDate: combinedDateTime, // Pass Date object
          isBreaking: data.isBreaking,
      };

      if (isEditing && headline?.id) {
        // Pass data conforming to HeadlineUpdateData (which includes Date for publishDate)
        await updateHeadlineAction(headline.id, headlineData);
        toast({ title: t('headlineUpdatedTitle'), description: t('headlineUpdatedDesc') });
      } else {
        // Pass data conforming to HeadlineCreateData (which includes Date for publishDate)
        await createHeadlineAction(headlineData);
        toast({ title: t('headlineCreatedTitle'), description: t('headlineCreatedDesc') });
      }
      onClose();
    } catch (error) {
      console.error("Error saving headline:", error);
      toast({
        title: t('error'),
        description: (error as Error).message || t('headlineSaveError'), // Show specific error message if available
        variant: "destructive",
      });
    }
  };

   // Function to handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setValue('publishTime', timeValue, { shouldValidate: true }); // Update form state
    setSelectedTime(timeValue); // Update local state for input control
  };

  // Helper to combine date and time for preview
   const getPreviewDate = () => {
       const date = getValues('publishDate');
       const time = getValues('publishTime');
       if (!date || !time) return new Date();
       const combined = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
         if (!isNaN(hours) && !isNaN(minutes)) {
             combined.setHours(hours, minutes, 0, 0);
         }
       return combined;
   };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:col-span-1">
          <DialogHeader>
            <DialogTitle>{isEditing ? t('editHeadline') : t('createHeadline')}</DialogTitle>
            <DialogDescription>
              {isEditing ? t('editHeadlineDesc') : t('createHeadlineDesc')}
            </DialogDescription>
          </DialogHeader>

          {/* Form Fields */}
          <div>
            <Label htmlFor="mainTitle">{t('mainTitle')}</Label>
            <Input id="mainTitle" {...register('mainTitle')} aria-invalid={errors.mainTitle ? "true" : "false"} />
            {errors.mainTitle && <p className="text-sm text-destructive mt-1">{errors.mainTitle.message}</p>}
          </div>

          <div>
            <Label htmlFor="subtitle">{t('subtitle')} <span className="text-muted-foreground">({t('optional')})</span></Label>
            <Textarea id="subtitle" {...register('subtitle')} />
            {errors.subtitle && <p className="text-sm text-destructive mt-1">{errors.subtitle.message}</p>}
          </div>

           {/* Rich Text Editor Placeholder */}
           <div>
                <Label htmlFor="content">{t('content')}</Label>
                <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                        <RichTextEditor
                            id="content"
                            value={field.value || ''}
                            onChange={field.onChange}
                            aria-invalid={errors.content ? "true" : "false"}
                        />
                    )}
                />
                {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
            </div>

           {/* Category Selection */}
           <div>
             <Label>{t('categories')}</Label>
             <Controller
               name="categoryIds"
               control={control}
               render={({ field }) => (
                 <div className="space-y-2 mt-1 border p-3 rounded-md max-h-32 overflow-y-auto">
                   {categories
                     .map((category) => (
                     <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                       <Checkbox
                         id={`category-${category.id}`}
                         checked={field.value?.includes(category.id)}
                         onCheckedChange={(checked) => {
                           const newValue = checked
                             ? [...(field.value || []), category.id]
                             : (field.value || []).filter((id) => id !== category.id);
                           field.onChange(newValue);
                         }}
                       />
                       <Label htmlFor={`category-${category.id}`} className="font-normal">
                         {category.name}
                       </Label>
                     </div>
                   ))}
                 </div>
               )}
             />
              {errors.categoryIds && <p className="text-sm text-destructive mt-1">{errors.categoryIds.message}</p>}
           </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* State */}
            <div>
              <Label htmlFor="state">{t('state')}</Label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder={t('selectState')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(['Draft', 'In Review', 'Approved', 'Archived'] as HeadlineState[]).map(s => (
                         <SelectItem key={s} value={s}>{t(s.toLowerCase().replace(' ', ''))}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
            </div>

             {/* Priority */}
             <div>
               <Label htmlFor="priority">{t('priority')}</Label>
               <Controller
                 name="priority"
                 control={control}
                 render={({ field }) => (
                   <Select onValueChange={field.onChange} value={field.value}>
                     <SelectTrigger id="priority">
                       <SelectValue placeholder={t('selectPriority')} />
                     </SelectTrigger>
                     <SelectContent>
                       {(['Normal', 'High'] as HeadlinePriority[]).map(p => (
                          <SelectItem key={p} value={p}>{t(p.toLowerCase())}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 )}
               />
               {errors.priority && <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
             {/* Display Lines */}
            <div>
                <Label htmlFor="displayLines">{t('displayLines')}</Label>
                <Controller
                    name="displayLines"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                            <SelectTrigger id="displayLines" className="w-[120px]">
                            <SelectValue placeholder={t('selectLines')} />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3].map(lines => (
                                    <SelectItem key={lines} value={String(lines)}>{lines} {lines === 1 ? t('line') : t('lines')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.displayLines && <p className="text-sm text-destructive mt-1">{errors.displayLines.message}</p>}
            </div>

             {/* Is Breaking Checkbox */}
            <div className="flex items-center space-x-2 pt-6">
                 <Controller
                    name="isBreaking"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id="isBreaking"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                 />
               <Label htmlFor="isBreaking" className="font-normal">{t('isBreaking')}</Label>
               {errors.isBreaking && <p className="text-sm text-destructive mt-1">{errors.isBreaking.message}</p>}
            </div>
          </div>


           {/* Publish Date and Time */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                   <Label htmlFor="publishDate">{t('publishDate')}</Label>
                   <Controller
                       name="publishDate"
                       control={control}
                       render={({ field }) => (
                           <Popover>
                               <PopoverTrigger asChild>
                                   <Button
                                       variant={"outline"}
                                       className={cn(
                                           "w-full justify-start text-left font-normal",
                                           !field.value && "text-muted-foreground"
                                       )}
                                   >
                                       <CalendarIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                       {/* Ensure field.value is a Date before formatting */}
                                       {field.value instanceof Date && !isNaN(field.value.getTime())
                                            ? format(field.value, "PPP")
                                            : <span>{t('pickADate')}</span>}
                                   </Button>
                               </PopoverTrigger>
                               <PopoverContent className="w-auto p-0">
                                   <Calendar
                                       mode="single"
                                       selected={field.value}
                                       onSelect={field.onChange}
                                       initialFocus
                                   />
                               </PopoverContent>
                           </Popover>
                       )}
                   />
                   {errors.publishDate && <p className="text-sm text-destructive mt-1">{errors.publishDate.message}</p>}
               </div>
               <div>
                    <Label htmlFor="publishTime">{t('publishTime')}</Label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                       {/* Use controlled input with local state `selectedTime` */}
                       <Input
                           id="publishTime"
                           type="time"
                           value={selectedTime} // Controlled by local state
                           onChange={handleTimeChange} // Updates both local and form state
                           className="pl-10 rtl:pr-10 rtl:pl-3"
                           aria-invalid={errors.publishTime ? "true" : "false"}
                        />
                    </div>
                   {errors.publishTime && <p className="text-sm text-destructive mt-1">{errors.publishTime.message}</p>}
               </div>
           </div>


          <DialogFooter className="col-span-1 md:col-span-2 pt-4">
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
             </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : (isEditing ? t('updateHeadline') : t('createHeadline'))}
            </Button>
          </DialogFooter>
        </form>

        {/* Preview Section */}
        <div className="space-y-4 md:col-span-1 bg-muted p-6 rounded-lg hidden md:block">
          <h3 className="text-lg font-semibold">{t('preview')}</h3>
           <HeadlinePreview
               mainTitle={watchedValues.mainTitle || ''}
               subtitle={watchedValues.subtitle || ''}
               displayLines={watchedValues.displayLines || 2}
               isBreaking={watchedValues.isBreaking} // Pass breaking status to preview
               publishDate={getPreviewDate()} // Pass combined date for preview
            />
             {/* Optional: Add preview for rich text content here if needed */}
             {/* <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: watchedValues.content || '<p>Content preview...</p>' }} />
             </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

