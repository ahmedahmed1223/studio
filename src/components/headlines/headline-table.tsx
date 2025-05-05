// @ts-nocheck comment due to react-beautiful-dnd type issues with React 18 StrictMode
// Remove the comment above if react-beautiful-dnd updates its types
'use client';

import type { Headline, Category, HeadlineState, HeadlinePriority } from '@/services/headline';
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
import { useState, useMemo, useEffect } from 'react';
import { HeadlineEditorModal } from './headline-editor-modal';
import { deleteHeadlineAction, reorderHeadlinesAction, deleteMultipleHeadlinesAction, updateMultipleHeadlineStatesAction } from '@/actions/headline-actions';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/**
 * Props for the HeadlineTable component.
 */
interface HeadlineTableProps {
  /** Array of headlines to display. */
  headlines: Headline[];
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
 * Uses a simple hash function to map category IDs to a predefined list of Tailwind color classes.
 * Ensures these classes are not purged by Tailwind (e.g., by adding them to a safelist if necessary).
 *
 * @param categoryId - The ID of the category (or the first category if multiple).
 * @param categories - The array of all category objects.
 * @returns A Tailwind CSS class string for the background color, or an empty string if no category or color found.
 */
const getCategoryColorClass = (categoryId: string | undefined, categories: Category[]): string => {
    if (!categoryId) return '';

    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < category.id.length; i++) {
        hash = category.id.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }

    // Predefined list of Tailwind utility classes for backgrounds
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
 * bulk actions (selection, state change, export, delete), and pagination.
 * Uses drag-and-drop for reordering within the current page.
 *
 * @param props - The props for the HeadlineTable component.
 * @returns A React component representing the headline table.
 */
export function HeadlineTable({ headlines: initialHeadlines, categories, currentPage, totalPages, isBreakingNewsList = false }: HeadlineTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [headlines, setHeadlines] = useState(initialHeadlines); // Local state for reordering
  const { toast } = useToast();
  const { t } = useLanguage();

  /** Memoized map of category IDs to names for efficient lookup. */
  const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.id, cat.name])), [categories]);

  /**
   * Effect to update the local `headlines` state when the `initialHeadlines` prop changes
   * (e.g., due to filtering or pagination) and clear the selection.
   */
  useEffect(() => {
    setHeadlines(initialHeadlines);
    setSelectedIds(new Set()); // Clear selection when data changes
  }, [initialHeadlines]);


  /** Opens the edit modal for the given headline. */
  const handleEdit = (headline: Headline) => {
    setEditingHeadline(headline);
    setIsModalOpen(true);
  };

  /**
   * Handles the deletion of a single headline.
   * Calls the server action and updates local state optimistically.
   * @param id - The ID of the headline to delete.
   */
  const handleDelete = async (id: string) => {
    try {
      await deleteHeadlineAction(id);
      toast({
        title: t('headlineDeletedTitle'),
        description: t('headlineDeletedDesc'),
      });
      // Update local state after deletion
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

  /** Closes the headline editor modal and resets the editing state. */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingHeadline(null);
    // Revalidation happens via server action, no manual refresh needed normally
  };

  /**
   * Gets a comma-separated string of category names for a given list of category IDs.
   * @param categoryIds - Array of category IDs.
   * @returns A string of category names or a fallback text.
   */
  const getCategoryNames = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return t('noCategory');
    return categoryIds.map(id => categoryMap.get(id) || t('unknown')).join(', ');
  };

  /**
   * Determines the visual variant for the state badge based on the HeadlineState.
   * @param state - The current state of the headline.
   * @returns The corresponding badge variant ('default', 'secondary', 'outline', 'destructive').
   */
  const getBadgeVariant = (state: HeadlineState): "default" | "secondary" | "outline" | "destructive" => {
    switch (state) {
      case 'Approved': return 'default';
      case 'In Review': return 'secondary';
      case 'Draft': return 'outline';
      case 'Archived': return 'destructive';
      default: return 'outline';
    }
  }

  /**
   * Determines the visual variant for the priority badge based on the HeadlinePriority.
   * @param priority - The priority of the headline.
   * @returns The corresponding badge variant ('destructive' for High, 'secondary' for Normal).
   */
  const getPriorityBadgeVariant = (priority: HeadlinePriority): "default" | "secondary" | "outline" | "destructive" => {
    return priority === 'High' ? 'destructive' : 'secondary';
  }

  // --- Selection Logic ---
  /**
   * Handles the change event of the "Select All" checkbox.
   * Updates the `selectedIds` state to include all or none of the current headlines.
   * @param checked - The new state of the checkbox (boolean or 'indeterminate').
   */
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    if (isChecked) {
      setSelectedIds(new Set(headlines.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  /**
   * Handles the change event of a row's checkbox.
   * Adds or removes the headline ID from the `selectedIds` state.
   * @param id - The ID of the headline row.
   * @param checked - The new state of the checkbox (boolean or 'indeterminate').
   */
  const handleSelectRow = (id: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  /** Boolean indicating if all headlines on the current page are selected. */
  const isAllSelected = headlines.length > 0 && selectedIds.size === headlines.length;
  /** Boolean indicating if some but not all headlines on the current page are selected. */
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < headlines.length;

  // --- Bulk Actions ---
  /**
   * Handles the bulk deletion of selected headlines.
   * Calls the server action and updates local state optimistically.
   */
  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      const idsToDelete = Array.from(selectedIds);
       try {
           await deleteMultipleHeadlinesAction(idsToDelete);
           toast({
               title: t('headlinesDeletedTitle', { count: idsToDelete.length }),
               description: t('headlinesDeletedDesc', { count: idsToDelete.length }),
           });
           // Update local state
           setHeadlines(prev => prev.filter(h => !idsToDelete.includes(h.id)));
           setSelectedIds(new Set());
       } catch (error) {
           console.error("Bulk delete failed:", error);
           toast({
               title: t('error'),
               description: t('bulkDeleteError'),
               variant: 'destructive',
           });
       }
  };

   /**
    * Handles changing the state for multiple selected headlines.
    * Calls the server action and updates local state optimistically.
    * @param newState - The target `HeadlineState` for the selected headlines.
    */
   const handleBulkStateChange = async (newState: HeadlineState) => {
       if (selectedIds.size === 0) return;
       const idsToUpdate = Array.from(selectedIds);
       try {
           await updateMultipleHeadlineStatesAction(idsToUpdate, newState);
           toast({
               title: t('headlinesStateUpdatedTitle'),
               description: t('headlinesStateUpdatedDesc', { count: idsToUpdate.length, state: t(newState.toLowerCase().replace(' ', '')) }),
           });
           // Update local state optimistically
            setHeadlines(prev => prev.map(h =>
                idsToUpdate.includes(h.id) ? { ...h, state: newState } : h
            ));
           setSelectedIds(new Set()); // Clear selection after action
       } catch (error) {
            console.error("Bulk state change error:", error)
           toast({
               title: t('error'),
               description: t('bulkStateUpdateError'),
               variant: 'destructive',
           });
       }
   };

   /**
    * Handles exporting the selected headlines.
    * Constructs a URL to the export API endpoint with selected IDs and triggers a download.
    */
   const handleBulkExport = () => {
       if (selectedIds.size === 0) return;
       const idsToExport = Array.from(selectedIds);
       const params = new URLSearchParams();
       // TODO: Retrieve format settings from Settings Context if available, otherwise default.
       params.set('format', 'csv'); // Defaulting to CSV for now
       params.set('ids', idsToExport.join(','));

       const exportUrl = `/api/export/headlines?${params.toString()}`;
       window.location.href = exportUrl; // Trigger download

       toast({ title: t('exportStartedTitle'), description: t('exportStartedDesc', { count: idsToExport.length }) });
       setSelectedIds(new Set()); // Clear selection
   }


  // --- Drag and Drop Logic ---
    /**
     * Handles the end of a drag-and-drop operation.
     * Updates the local state optimistically and calls the server action to persist the new order.
     * Reverts local state if the server action fails.
     * @param result - The result object provided by `react-beautiful-dnd`.
     */
    const onDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        // Dropped outside the list or in the same position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        // Perform reorder optimistically in local state
        const newHeadlines = Array.from(headlines);
        const [reorderedItem] = newHeadlines.splice(source.index, 1);
        newHeadlines.splice(destination.index, 0, reorderedItem);

        // Update the local state immediately for visual feedback
        setHeadlines(newHeadlines);

        // Get the list of IDs in the new order from the updated local state
        const orderedIdsOnPage = newHeadlines.map(h => h.id);

        // Call the server action to persist the reordering
        try {
            await reorderHeadlinesAction(orderedIdsOnPage);
             toast({
                 title: t('reorderSuccessTitle'),
                 description: t('reorderSuccessDesc'),
            });
             // Data revalidation should happen via the server action's revalidatePath
        } catch (error) {
             console.error("Reorder failed:", error);
             toast({
                 title: t('error'),
                 description: t('reorderErrorDesc'),
                 variant: 'destructive',
             });
             // Revert local state if backend update fails
             setHeadlines(initialHeadlines);
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
                   <SelectItem value="Approved">{t('setStateTo', { state: t('approved')})}</SelectItem>
                  <SelectItem value="In Review">{t('setStateTo', { state: t('inreview')})}</SelectItem>
                  <SelectItem value="Draft">{t('setStateTo', { state: t('draft')})}</SelectItem>
                  <SelectItem value="Archived">{t('setStateTo', { state: t('archived')})}</SelectItem>
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
                  <TableHead className="w-10 sticky left-10 bg-background z-10"></TableHead>{/* Drag Handle */}
                  <TableHead className="min-w-[250px]">{t('title')}</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">{t('category')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('state')}</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[100px]">{t('priority')}</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[180px]">{t('publishDate')}</TableHead>
                  <TableHead className="w-16 sticky right-0 bg-background z-10"><span className="sr-only">{t('actions')}</span></TableHead>{/* Actions */}
                </TableRow>
              </TableHeader>
              {/* Droppable Area for Headlines */}
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
                                        key={headline.id}
                                        data-state={selectedIds.has(headline.id) ? 'selected' : undefined}
                                        className={cn(
                                           "group", // group class for hover states
                                           getCategoryColorClass(headline.categories[0], categories), // Color based on first category
                                           snapshot.isDragging ? 'bg-primary/10 shadow-lg opacity-90' : '', // Style when dragging
                                           selectedIds.has(headline.id) ? 'bg-primary/5' : '' // Style when selected
                                        )}
                                        style={{ ...providedDraggable.draggableProps.style }} // Apply styles from dnd
                                    >
                                        <TableCell padding="checkbox" className="sticky left-0 bg-inherit z-10">
                                            <Checkbox
                                                checked={selectedIds.has(headline.id)}
                                                onCheckedChange={(checked) => handleSelectRow(headline.id, checked)}
                                                aria-label={t('selectRow')}
                                                className="translate-y-[2px]"
                                            />
                                        </TableCell>
                                         <TableCell
                                            padding="none"
                                            className="w-10 touch-none cursor-grab sticky left-10 bg-inherit z-10"
                                            {...providedDraggable.dragHandleProps} // Apply drag handle props
                                         >
                                            <GripVertical className="h-5 w-5 text-muted-foreground mx-auto" />
                                        </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="font-semibold">{headline.mainTitle}</div>
                                        {headline.subtitle && <div className="text-sm text-muted-foreground mt-1">{headline.subtitle}</div>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm">{getCategoryNames(headline.categories)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getBadgeVariant(headline.state)} className="whitespace-nowrap">{t(headline.state.toLowerCase().replace(' ', ''))}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant={getPriorityBadgeVariant(headline.priority)} className="whitespace-nowrap">{t(headline.priority.toLowerCase())}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap">{format(headline.publishDate, 'PPp')}</TableCell>
                                    <TableCell className="w-16 sticky right-0 bg-inherit z-10">
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
      {isModalOpen && editingHeadline && (
        <HeadlineEditorModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          headline={editingHeadline}
          categories={categories}
          isBreaking={editingHeadline.isBreaking} // Pass breaking status if editing
        />
      )}
      {/* Headline Editor Modal (Create Mode) */}
       {isModalOpen && !editingHeadline && (
          <HeadlineEditorModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            headline={null} // Null for creation
            categories={categories}
            isBreaking={isBreakingNewsList} // Default based on the list type
          />
      )}
    </>
  );
}
