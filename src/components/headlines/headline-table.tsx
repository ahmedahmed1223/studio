
// @ts-nocheck comment due to react-beautiful-dnd type issues with React 18 StrictMode
// Remove the comment above if react-beautiful-dnd updates its types
'use client';

import React, { useState, useMemo, useEffect } from 'react'; // Import React
import type { Headline, Category, HeadlineState, HeadlinePriority, GetHeadlinesResult } from '@/services/headline'; // Use GetHeadlinesResult type
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, GripVertical, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { Pagination } from '@/components/common/pagination';
import { HeadlineEditorModal } from './headline-editor-modal';
import { deleteHeadlineAction, reorderHeadlinesAction, deleteMultipleHeadlinesAction, updateMultipleHeadlineStatesAction } from '@/actions/headline-actions';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Type for headlines within the component, expecting Date objects
type HeadlineWithDate = Headline & { publishDate: Date };

/**
 * Props for the HeadlineTable component.
 */
interface HeadlineTableProps {
  /** Array of headlines to display (with Date objects). */
  headlines: HeadlineWithDate[];
  /** Array of all available categories. */
  categories: Category[];
  /** Current page number for pagination. */
  currentPage: number;
  /** Total number of pages for pagination. */
  totalPages: number;
  /** Flag indicating if this table is specifically for breaking news. */
  isBreakingNewsList?: boolean;
}

/**
 * Generates a subtle background color class based on a category ID.
 */
const getCategoryColorClass = (categoryId: string | undefined, categories: Category[]): string => {
    if (!categoryId) return '';
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    let hash = 0;
    for (let i = 0; i < category.id.length; i++) {
        hash = category.id.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const colorClasses = [
        'bg-blue-50 dark:bg-blue-900/20',
        'bg-green-50 dark:bg-green-900/20',
        'bg-yellow-50 dark:bg-yellow-900/20',
        'bg-purple-50 dark:bg-purple-900/20',
        'bg-red-50 dark:bg-red-900/20',
        'bg-indigo-50 dark:bg-indigo-900/20',
        'bg-pink-50 dark:bg-pink-900/20',
        'bg-gray-50 dark:bg-gray-700/20',
    ];
    const colorIndex = Math.abs(hash) % colorClasses.length;
    return colorClasses[colorIndex];
};

/**
 * Renders a table displaying headlines with options for editing, deleting, reordering,
 * bulk actions, and pagination.
 * Expects `headlines` prop to contain Date objects for `publishDate`.
 *
 * @param props - The props for the HeadlineTable component.
 * @returns A React component representing the headline table.
 */
export function HeadlineTable({ headlines: initialHeadlines, categories, currentPage, totalPages, isBreakingNewsList = false }: HeadlineTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<HeadlineWithDate | null>(null); // State holds HeadlineWithDate
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [headlines, setHeadlines] = useState<HeadlineWithDate[]>(initialHeadlines); // Local state holds HeadlineWithDate[]
  const { toast } = useToast();
  const { t } = useLanguage();

  const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.id, cat.name])), [categories]);

  useEffect(() => {
    setHeadlines(initialHeadlines); // Update local state when prop changes
    setSelectedIds(new Set());
  }, [initialHeadlines]);


  const handleEdit = (headline: HeadlineWithDate) => { // Function expects HeadlineWithDate
    setEditingHeadline(headline);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHeadlineAction(id);
      toast({
        title: t('headlineDeletedTitle'),
        description: t('headlineDeletedDesc'),
      });
      setHeadlines(prev => prev.filter(h => h.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
       console.error("Delete failed:", error);
      toast({
        title: t('error'),
        description: t('headlineDeleteError'),
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingHeadline(null);
  };

  const getCategoryNames = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return t('noCategory');
    return categoryIds.map(id => categoryMap.get(id) || t('unknown')).join(', ');
  };

  const getBadgeVariant = (state: HeadlineState): "default" | "secondary" | "outline" | "destructive" => {
    switch (state) {
      case 'Approved': return 'default';
      case 'In Review': return 'secondary';
      case 'Draft': return 'outline';
      case 'Archived': return 'destructive';
      default: return 'outline';
    }
  }

  const getPriorityBadgeVariant = (priority: HeadlinePriority): "default" | "secondary" | "outline" | "destructive" => {
    return priority === 'High' ? 'destructive' : 'secondary';
  }

  // --- Selection Logic ---
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedIds(isChecked ? new Set(headlines.map(h => h.id)) : new Set());
  };

  const handleSelectRow = (id: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(id); else newSet.delete(id);
      return newSet;
    });
  };

  const isAllSelected = headlines.length > 0 && selectedIds.size === headlines.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < headlines.length;

  // --- Bulk Actions ---
  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      const idsToDelete = Array.from(selectedIds);
       try {
           await deleteMultipleHeadlinesAction(idsToDelete);
           toast({
               title: t('headlinesDeletedTitle', { count: idsToDelete.length }),
               description: t('headlinesDeletedDesc', { count: idsToDelete.length }),
           });
           setHeadlines(prev => prev.filter(h => !idsToDelete.includes(h.id)));
           setSelectedIds(new Set());
       } catch (error) {
           console.error("Bulk delete failed:", error);
           toast({ title: t('error'), description: t('bulkDeleteError'), variant: 'destructive' });
       }
  };

   const handleBulkStateChange = async (newState: HeadlineState) => {
       if (selectedIds.size === 0) return;
       const idsToUpdate = Array.from(selectedIds);
       try {
           await updateMultipleHeadlineStatesAction(idsToUpdate, newState);
           toast({
               title: t('headlinesStateUpdatedTitle'),
               description: t('headlinesStateUpdatedDesc', { count: idsToUpdate.length, state: t(newState.toLowerCase().replace(' ', '')) }),
           });
            setHeadlines(prev => prev.map(h =>
                idsToUpdate.includes(h.id) ? { ...h, state: newState } : h
            ));
           setSelectedIds(new Set());
       } catch (error) {
            console.error("Bulk state change error:", error)
           toast({ title: t('error'), description: t('bulkStateUpdateError'), variant: 'destructive' });
       }
   };

   const handleBulkExport = () => {
       if (selectedIds.size === 0) return;
       const idsToExport = Array.from(selectedIds);
       const params = new URLSearchParams();
       // TODO: Use settings context for format
       params.set('format', 'csv');
       params.set('ids', idsToExport.join(','));

       const exportUrl = `/api/export/headlines?${params.toString()}`;
       window.location.href = exportUrl;

       toast({ title: t('exportStartedTitle'), description: t('exportStartedDesc', { count: idsToExport.length }) });
       setSelectedIds(new Set());
   }


  // --- Drag and Drop Logic ---
    const onDragEnd = async (result: DropResult) => {
        const { destination, source } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const newHeadlines = Array.from(headlines);
        const [reorderedItem] = newHeadlines.splice(source.index, 1);
        newHeadlines.splice(destination.index, 0, reorderedItem);
        setHeadlines(newHeadlines); // Optimistic update

        const orderedIdsOnPage = newHeadlines.map(h => h.id);

        try {
            await reorderHeadlinesAction(orderedIdsOnPage);
             toast({ title: t('reorderSuccessTitle'), description: t('reorderSuccessDesc') });
        } catch (error) {
             console.error("Reorder failed:", error);
             toast({ title: t('error'), description: t('reorderErrorDesc'), variant: 'destructive' });
             setHeadlines(initialHeadlines); // Revert on failure
        }
    };

  return (
    <>
      {/* Bulk Action Controls */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted rounded-md border">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
             {t('selectedCount', { count: selectedIds.size })}
          </span>
          {/* Bulk State Change Dropdown */}
          <Select onValueChange={(value) => {
              if (['Draft', 'In Review', 'Approved', 'Archived'].includes(value)) {
                  handleBulkStateChange(value as HeadlineState);
              }
          }}>
              <SelectTrigger className="w-full sm:w-auto min-w-[180px] h-9">
                  <SelectValue placeholder={t('changeStatePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                   {(['Approved', 'In Review', 'Draft', 'Archived'] as HeadlineState[]).map(state => (
                      <SelectItem key={state} value={state}>{t('setStateTo', { state: t(state.toLowerCase().replace(' ', ''))})}</SelectItem>
                   ))}
              </SelectContent>
          </Select>
           {/* Bulk Export Button */}
           <Button variant="outline" size="sm" onClick={handleBulkExport} className="h-9">
               <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0"/>
               {t('exportSelected')}
           </Button>
           {/* Bulk Delete Button */}
           <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-9">
               <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0"/>
               {t('deleteSelected')}
           </Button>
        </div>
      )}

        {/* Drag and Drop Context */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="rounded-md border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead padding="checkbox" className="w-10 sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAll}
                      aria-label={t('selectAllRows')}
                      className="translate-y-[2px]"
                    />
                  </TableHead>
                  <TableHead className="w-10 sticky left-10 bg-background z-10"></TableHead>
                  <TableHead className="min-w-[250px]">{t('title')}</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">{t('category')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('state')}</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[100px]">{t('priority')}</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[180px]">{t('publishDate')}</TableHead>
                  <TableHead className="w-16 sticky right-0 bg-background z-10"><span className="sr-only">{t('actions')}</span></TableHead>
                </TableRow>
              </TableHeader>
              {/* Droppable Area */}
              <Droppable droppableId="headlines">
                {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {headlines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                            {t('noHeadlinesFound')}
                            </TableCell>
                        </TableRow>
                        ) : (
                        headlines.map((headline, index) => (
                            <Draggable key={headline.id} draggableId={headline.id} index={index}>
                                {(providedDraggable, snapshot) => (
                                    <TableRow
                                        ref={providedDraggable.innerRef}
                                        {...providedDraggable.draggableProps}
                                        data-state={selectedIds.has(headline.id) ? 'selected' : undefined}
                                        className={cn(
                                           "group",
                                           getCategoryColorClass(headline.categories[0], categories),
                                           snapshot.isDragging ? 'bg-primary/10 shadow-lg opacity-90' : '',
                                           selectedIds.has(headline.id) ? 'bg-primary/5' : ''
                                        )}
                                        style={{ ...providedDraggable.draggableProps.style }} // Apply styles from dnd
                                    >
                                        {/* Checkbox Cell */}
                                        <TableCell padding="checkbox" className="sticky left-0 bg-inherit z-10" key={`${headline.id}-checkbox`}>
                                            <Checkbox
                                                checked={selectedIds.has(headline.id)}
                                                onCheckedChange={(checked) => handleSelectRow(headline.id, checked)}
                                                aria-label={t('selectRow')}
                                                className="translate-y-[2px]"
                                            />
                                        </TableCell>
                                         {/* Drag Handle Cell */}
                                         <TableCell
                                            padding="none"
                                            className="w-10 touch-none cursor-grab sticky left-10 bg-inherit z-10"
                                            {...providedDraggable.dragHandleProps}
                                            key={`${headline.id}-draghandle`}
                                         >
                                            <GripVertical className="h-5 w-5 text-muted-foreground mx-auto" />
                                        </TableCell>
                                    {/* Title Cell */}
                                    <TableCell className="font-medium" key={`${headline.id}-title`}>
                                        <div className="font-semibold">{headline.mainTitle}</div>
                                        {headline.subtitle && <div className="text-sm text-muted-foreground mt-1">{headline.subtitle}</div>}
                                    </TableCell>
                                    {/* Category Cell */}
                                    <TableCell className="hidden md:table-cell text-sm" key={`${headline.id}-category`}>{getCategoryNames(headline.categories)}</TableCell>
                                    {/* State Cell */}
                                    <TableCell key={`${headline.id}-state`}>
                                        <Badge variant={getBadgeVariant(headline.state)} className="whitespace-nowrap">{t(headline.state.toLowerCase().replace(' ', ''))}</Badge>
                                    </TableCell>
                                    {/* Priority Cell */}
                                    <TableCell className="hidden sm:table-cell" key={`${headline.id}-priority`}>
                                        <Badge variant={getPriorityBadgeVariant(headline.priority)} className="whitespace-nowrap">{t(headline.priority.toLowerCase())}</Badge>
                                    </TableCell>
                                    {/* Publish Date Cell - Format Date object */}
                                    <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap" key={`${headline.id}-date`}>
                                        {headline.publishDate instanceof Date && !isNaN(headline.publishDate.getTime()) ? format(headline.publishDate, 'PPp') : 'Invalid Date'}
                                    </TableCell>
                                    {/* Actions Cell */}
                                    <TableCell className="w-16 sticky right-0 bg-inherit z-10" key={`${headline.id}-actions`}>
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">{t('openMenu')}</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(headline)}>
                                            <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                            <span>{t('edit')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(headline.id)}
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                                <span>{t('delete')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    </TableRow>
                                )}
                            </Draggable>
                        ))
                        )}
                        {/* Placeholder for empty space while dragging */}
                        {provided.placeholder}
                    </TableBody>
                )}
              </Droppable>
            </Table>
          </div>
      </DragDropContext>

      {/* Pagination */}
      {totalPages > 1 && (
         <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}

      {/* Headline Editor Modal (Edit Mode) */}
      {/* Ensure the modal receives the headline with the Date object */}
      {isModalOpen && editingHeadline && (
        <HeadlineEditorModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          headline={editingHeadline} // Pass HeadlineWithDate
          categories={categories}
          isBreaking={editingHeadline.isBreaking}
        />
      )}
    </>
  );
}

