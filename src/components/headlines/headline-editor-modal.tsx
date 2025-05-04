'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea is similar to Input
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
import { useLanguage } from '@/context/language-context'; // Import language context

interface HeadlineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  headline?: Headline | null; // Optional: Pass headline for editing
  categories: Category[];
}

const headlineSchema = z.object({
  mainTitle: z.string().min(1, { message: "Main title is required" }),
  subtitle: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, { message: "At least one category is required" }),
  state: z.enum(['Draft', 'In Review', 'Approved', 'Archived']),
  priority: z.enum(['High', 'Normal']),
  displayLines: z.number().min(1).max(3),
  publishDate: z.date({ required_error: "Publish date is required" }),
  publishTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)" }).optional(),
});

type HeadlineFormData = z.infer<typeof headlineSchema>;

export function HeadlineEditorModal({ isOpen, onClose, headline, categories }: HeadlineEditorModalProps) {
  const isEditing = !!headline;
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function
  const [selectedTime, setSelectedTime] = useState<string>(headline ? format(headline.publishDate, 'HH:mm') : format(new Date(), 'HH:mm'));


  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setValue, // To set date/time values
  } = useForm<HeadlineFormData>({
    resolver: zodResolver(headlineSchema),
    defaultValues: {
      mainTitle: headline?.mainTitle || '',
      subtitle: headline?.subtitle || '',
      categoryIds: headline?.categories || [],
      state: headline?.state || 'Draft',
      priority: headline?.priority || 'Normal',
      displayLines: headline?.displayLines || 2,
      publishDate: headline?.publishDate || new Date(),
      publishTime: headline ? format(headline.publishDate, 'HH:mm') : format(new Date(), 'HH:mm'),
    },
  });

   // Watch form values for preview
  const watchedValues = watch();

  // Reset form when modal closes or headline changes
  useEffect(() => {
    if (isOpen) {
        const defaultTime = headline ? format(headline.publishDate, 'HH:mm') : format(new Date(), 'HH:mm');
        reset({
            mainTitle: headline?.mainTitle || '',
            subtitle: headline?.subtitle || '',
            categoryIds: headline?.categories || [],
            state: headline?.state || 'Draft',
            priority: headline?.priority || 'Normal',
            displayLines: headline?.displayLines || 2,
            publishDate: headline?.publishDate || new Date(),
            publishTime: defaultTime,
        });
        setSelectedTime(defaultTime);
    }
  }, [isOpen, headline, reset]);


  const onSubmit = async (data: HeadlineFormData) => {
    try {
      // Combine date and time
      const [hours, minutes] = (data.publishTime || selectedTime).split(':').map(Number);
      const combinedDateTime = new Date(data.publishDate);
      combinedDateTime.setHours(hours, minutes, 0, 0);

      const headlineData = {
          mainTitle: data.mainTitle,
          subtitle: data.subtitle || '',
          categories: data.categoryIds,
          state: data.state,
          priority: data.priority,
          displayLines: data.displayLines,
          publishDate: combinedDateTime,
      };

      if (isEditing && headline?.id) {
        await updateHeadlineAction(headline.id, headlineData);
        toast({ title: t('headlineUpdatedTitle'), description: t('headlineUpdatedDesc') });
      } else {
        await createHeadlineAction(headlineData);
        toast({ title: t('headlineCreatedTitle'), description: t('headlineCreatedDesc') });
      }
      onClose(); // Close modal on success
       // Optionally trigger data refresh here
    } catch (error) {
      console.error("Error saving headline:", error);
      toast({
        title: t('error'),
        description: t('headlineSaveError'),
        variant: "destructive",
      });
    }
  };

   // Function to handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setValue('publishTime', timeValue, { shouldValidate: true });
    setSelectedTime(timeValue);
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
          </div>

           {/* Category Selection */}
           <div>
             <Label>{t('categories')}</Label>
             <Controller
               name="categoryIds"
               control={control}
               render={({ field }) => (
                 <div className="space-y-2 mt-1 border p-3 rounded-md max-h-32 overflow-y-auto">
                   {categories.map((category) => (
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
                                       {field.value ? format(field.value, "PPP") : <span>{t('pickADate')}</span>}
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
                       <Input
                           id="publishTime"
                           type="time"
                           value={selectedTime}
                           onChange={handleTimeChange}
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
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
