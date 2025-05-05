
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
import { MoreHorizontal, Edit, Trash2, GripVertical, Download, Clock } from 'lucide-react'; // Added Clock
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from '@/components/common/pagination';
import { HeadlineEditorModal } from './headline-editor-modal';
import { deleteHeadlineAction, reorderHeadlinesAction, deleteMultipleHeadlinesAction, updateMultipleHeadlineStatesAction } from '@/actions/headline-actions';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ClientFormattedDate } from '@/components/common/client-formatted-date'; // Import the new component

// Type for headlines within the component, expecting Date objects
type HeadlineWithDate = Headline & { publishDate: Date };

/**
 * @fileoverview Renders a table displaying headlines with options for editing, deleting, reordering,
 * bulk actions, and pagination. Includes drag-and-drop functionality and category-based row styling.
 */


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
 * @param categoryId - The ID of the category (optional).
 * @param categories - An array of all available Category objects.
 * @returns A Tailwind CSS background color class string, or an empty string.
 */
const getCategoryColorClass = (categoryId: string | undefined, categories: Category[]): string => {
    if (!categoryId) return '';
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    // Simple hash function to get a somewhat consistent color based on ID
    let hash = 0;
    for (let i = 0; i < category.id.length; i++) {
        hash = category.id.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deletion state for optimistic UI
  const { toast } = useToast();
  const { t } = useLanguage();

  // Memoized map for quick category name lookups
  const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.id, cat.name])), [categories]);

  // Effect to update local state when the incoming headlines prop changes (e.g., due to filtering/pagination)
  useEffect(() => {
    setHeadlines(initialHeadlines); // Update local state with new data
    setSelectedIds(new Set()); // Clear selection when data changes
  }, [initialHeadlines]);


  /**
   * Opens the HeadlineEditorModal in edit mode for the selected headline.
   * @param headline - The headline object (including Date object) to edit.
   */
  const handleEdit = (headline: HeadlineWithDate) => {
    setEditingHeadline(headline);
    setIsModalOpen(true);
  };

  /**
   * Handles the deletion of a single headline.
   * Calls the deleteHeadlineAction and updates the local state optimistically.
   * Shows success or error toasts.
   * @param id - The ID of the headline to delete.
   */
  const handleDelete = async (id: string) => {
    setIsDeleting(id); // Set deleting state for optimistic UI
    try {
      await deleteHeadlineAction(id);
      toast({
        title: t('headlineDeletedTitle'),
        description: t('headlineDeletedDesc'),
      });
      // Optimistically remove from local state
      setHeadlines(prev => prev.filter(h => h.id !== id));
      // Remove from selection if selected
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
    } finally {
      setIsDeleting(null); // Reset deleting state
    }
  };

  /** Closes the HeadlineEditorModal and resets the editing state. */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingHeadline(null);
  };

  /**
   * Gets a comma-separated string of category names for a headline.
   * @param categoryIds - An array of category IDs associated with the headline.
   * @returns A string of category names, or a default text if none.
   */
  const getCategoryNames = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return t('noCategory');
    return categoryIds.map(id => categoryMap.get(id) || t('unknown')).join(', ');
  };

  /**
   * Determines the appropriate Badge variant based on the headline state.
   * @param state - The HeadlineState.
   * @returns A Badge variant string ('default', 'secondary', 'outline', 'destructive').
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
   * Determines the appropriate Badge variant based on the headline priority.
   * @param priority - The HeadlinePriority.
   * @returns A Badge variant string ('destructive' for High, 'secondary' for Normal).
   */
  const getPriorityBadgeVariant = (priority: HeadlinePriority): "default" | "secondary" | "outline" | "destructive" => {
    return priority === 'High' ? 'destructive' : 'secondary';
  }

  // --- Selection Logic ---

  /**
   * Handles the 'select all' checkbox change event.
   * Selects or deselects all headlines currently displayed on the page.
   * @param checked - The new checked state (boolean or 'indeterminate').
   */
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedIds(isChecked ? new Set(headlines.map(h => h.id)) : new Set());
  };

  /**
   * Handles the checkbox change event for a single row.
   * Adds or removes the headline ID from the selection set.
   * @param id - The ID of the headline row.
   * @param checked - The new checked state (boolean or 'indeterminate').
   */
  const handleSelectRow = (id: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(id); else newSet.delete(id);
      return newSet;
    });
  };

  // Derived state for the 'select all' checkbox
  const isAllSelected = headlines.length > 0 && selectedIds.size === headlines.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < headlines.length;

  // --- Bulk Actions ---

  /**
   * Handles the bulk deletion of selected headlines.
   * Calls the deleteMultipleHeadlinesAction and updates the local state optimistically.
   * Shows success or error toasts.
   */
  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return; // No items selected
      const idsToDelete = Array.from(selectedIds);
       try {
           await deleteMultipleHeadlinesAction(idsToDelete);
           toast({
               title: t('headlinesDeletedTitle', { count: idsToDelete.length }),
               description: t('headlinesDeletedDesc', { count: idsToDelete.length }),
           });
           // Optimistically remove from local state
           setHeadlines(prev => prev.filter(h => !idsToDelete.includes(h.id)));
           setSelectedIds(new Set()); // Clear selection
       } catch (error) {
           console.error("Bulk delete failed:", error);
           toast({ title: t('error'), description: t('bulkDeleteError'), variant: 'destructive' });
       }
  };

   /**
    * Handles changing the state for multiple selected headlines.
    * Calls the updateMultipleHeadlineStatesAction and updates the local state optimistically.
    * Shows success or error toasts.
    * @param newState - The target HeadlineState to set.
    */
   const handleBulkStateChange = async (newState: HeadlineState) => {
       if (selectedIds.size === 0) return; // No items selected
       const idsToUpdate = Array.from(selectedIds);
       try {
           await updateMultipleHeadlineStatesAction(idsToUpdate, newState);
           toast({
               title: t('headlinesStateUpdatedTitle'),
               description: t('headlinesStateUpdatedDesc', { count: idsToUpdate.length, state: t(newState.toLowerCase().replace(' ', '')) }),
           });
           // Optimistically update local state
            setHeadlines(prev => prev.map(h =>
                idsToUpdate.includes(h.id) ? { ...h, state: newState } : h
            ));
           setSelectedIds(new Set()); // Clear selection
       } catch (error) {
            console.error("Bulk state change error:", error)
           toast({ title: t('error'), description: t('bulkStateUpdateError'), variant: 'destructive' });
       }
   };

   /**
    * Initiates the export of selected headlines by redirecting to the export API endpoint.
    * Uses the 'csv' format and includes the selected IDs in the URL parameters.
    * Shows a toast notification indicating the export has started.
    */
   const handleBulkExport = () => {
       if (selectedIds.size === 0) return; // No items selected
       const idsToExport = Array.from(selectedIds);
       const params = new URLSearchParams();
       // Use 'csv' format for bulk selection export, or fetch from settings context if needed
       params.set('format', 'csv');
       params.set('ids', idsToExport.join(',')); // Pass specific IDs

       const exportUrl = `/api/export/headlines?${params.toString()}`;
       // Trigger download by navigating
       window.location.href = exportUrl;

       toast({ title: t('exportStartedTitle'), description: t('exportStartedDesc', { count: idsToExport.length }) });
       setSelectedIds(new Set()); // Clear selection after initiating export
   }


  // --- Drag and Drop Logic ---

    /**
     * Handles the end of a drag-and-drop operation.
     * Updates the local order optimistically and calls the reorderHeadlinesAction.
     * Reverts the local order if the action fails.
     * Shows success or error toasts.
     * @param result - The DropResult object from react-beautiful-dnd.
     */
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Exit if dropped outside a droppable area or back into the same position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        // Create a new ordered array based on the drag result
        const newHeadlines = Array.from(headlines);
        const [reorderedItem] = newHeadlines.splice(source.index, 1);
        newHeadlines.splice(destination.index, 0, reorderedItem);

        // Optimistic UI update
        setHeadlines(newHeadlines);

        // Extract the ordered IDs for the current page/view
        const orderedIdsOnPage = newHeadlines.map(h => h.id);

        // Call the server action to persist the new order
        try {
            // The action should ideally handle calculating the absolute order based on page/context
            // For this mock, we pass the IDs in their new page order.
            // A more robust implementation might require passing source/destination indices and page info.
            await reorderHeadlinesAction(orderedIdsOnPage);
             toast({ title: t('reorderSuccessTitle'), description: t('reorderSuccessDesc') });
             // No need to refetch here, optimistic update is applied.
             // However, if the action modifies order numbers extensively, a revalidation might be desired.
        } catch (error) {
             console.error("Reorder failed:", error);
             toast({ title: t('error'), description: t('reorderErrorDesc'), variant: 'destructive' });
             // Revert the optimistic UI update on failure
             // Note: Reverting might cause a flicker. Consider re-fetching instead.
             // setHeadlines(initialHeadlines); // Revert to original state before drag
             // Or better: trigger a refetch via revalidation in the action or by router.refresh() if needed
        }
    };

  return (
    <>
      {/* Bulk Action Controls - Visible only when items are selected */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted rounded-md border">
          {/* Selection Count */}
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
             {t('selectedCount', { count: selectedIds.size })}
          </span>

          {/* Bulk State Change Dropdown */}
          <Select onValueChange={(value) => {
              // Ensure a valid state was selected before calling the action
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

        {/* Drag and Drop Context wraps the table */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="rounded-md border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Checkbox Header (Select All) */}
                  <TableHead padding="checkbox" className="w-10 sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAll}
                      aria-label={t('selectAllRows')}
                      className="translate-y-[2px]"
                    />
                  </TableHead>
                  {/* Drag Handle Header */}
                  <TableHead className="w-10 sticky left-10 bg-background z-10"></TableHead>
                  {/* Column Headers */}
                  <TableHead className="min-w-[250px]">{t('title')}</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">{t('category')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('state')}</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[100px]">{t('priority')}</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[180px]">{t('publishDate')}</TableHead>
                  {/* Actions Header */}
                  <TableHead className="w-16 sticky right-0 bg-background z-10"><span className="sr-only">{t('actions')}</span></TableHead>
                </TableRow>
              </TableHeader>

              {/* Droppable Area for table rows */}
              <Droppable droppableId="headlines">
                {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {/* Message when no headlines are found */}
                        {headlines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                            {t('noHeadlinesFound')}
                            </TableCell>
                        </TableRow>
                        ) : (
                        // Map through headlines to render draggable rows
                        headlines.map((headline, index) => (
                            <Draggable key={headline.id} draggableId={headline.id} index={index}>
                                {(providedDraggable, snapshot) => (
                                    <TableRow
                                        ref={providedDraggable.innerRef}
                                        {...providedDraggable.draggableProps}
                                        data-state={selectedIds.has(headline.id) ? 'selected' : undefined}
                                        className={cn(
                                           "group", // For potential group-hover styles
                                           getCategoryColorClass(headline.categories[0], categories), // Apply category-based background
                                           snapshot.isDragging ? 'bg-primary/10 shadow-lg opacity-90' : '', // Style while dragging
                                           selectedIds.has(headline.id) ? 'bg-primary/5' : '', // Style when selected
                                           isDeleting === headline.id ? 'opacity-50' : '' // Style when deleting
                                        )}
                                        style={{ ...providedDraggable.draggableProps.style }} // Apply styles from dnd library
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
                                            {...providedDraggable.dragHandleProps} // Attach drag handle props
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
                                        {/* Publish Date Cell - Use ClientFormattedDate */}
                                        <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap" key={`${headline.id}-date`}>
                                            <ClientFormattedDate date={headline.publishDate} formatString="PPp" />
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
                                                {/* Edit Action */}
                                                <DropdownMenuItem onClick={() => handleEdit(headline)}>
                                                <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                                <span>{t('edit')}</span>
                                                </DropdownMenuItem>
                                                {/* Delete Action */}
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(headline.id)}
                                                    disabled={isDeleting === headline.id} // Disable while deleting
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                >
                                                    {isDeleting === headline.id ? (
                                                        <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-current rounded-full"></span>
                                                    ) : (
                                                        <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                                    )}
                                                    <span>{isDeleting === headline.id ? t('deleting') : t('delete')}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Draggable>
                        ))
                        )}
                        {/* Placeholder provided by react-beautiful-dnd for spacing during drag */}
                        {provided.placeholder}
                    </TableBody>
                )}
              </Droppable>
            </Table>
          </div>
      </DragDropContext>

      {/* Pagination Controls - Visible only if more than one page */}
      {totalPages > 1 && (
         <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}

      {/* Headline Editor Modal (used for editing) */}
      {/* Ensure the modal receives the headline with the Date object */}
      {isModalOpen && editingHeadline && (
        <HeadlineEditorModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          headline={editingHeadline} // Pass HeadlineWithDate
          categories={categories}
          isBreaking={editingHeadline.isBreaking} // Pass breaking status to modal
        />
      )}
    </>
  );
}
