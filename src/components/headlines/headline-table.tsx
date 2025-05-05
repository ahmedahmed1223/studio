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
import { MoreHorizontal, Edit, Trash2, GripVertical, Download } from 'lucide-react'; // Added Download icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { format } from 'date-fns';
import { Pagination } from '@/components/common/pagination';
import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { HeadlineEditorModal } from './headline-editor-modal';
import { deleteHeadlineAction, updateHeadlineAction, reorderHeadlinesAction, deleteMultipleHeadlinesAction, updateMultipleHeadlineStatesAction } from '@/actions/headline-actions'; // Import actions
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
// Removed AlertDialog imports as confirmation is removed
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; // Use hello-pangea fork for React 18+
import type { DropResult } from '@hello-pangea/dnd'; // Import DropResult type
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface HeadlineTableProps {
  headlines: Headline[];
  categories: Category[];
  currentPage: number;
  totalPages: number;
  isBreakingNewsList?: boolean; // Flag for breaking news specific rendering/behavior
}

// Helper function to get a subtle background color based on category ID hash
// This is a simple example; you might want a more sophisticated mapping
const getCategoryColorClass = (categoryId: string | undefined, categories: Category[]): string => {
    if (!categoryId) return '';

    // Find the first category to determine color (or handle multiple categories differently)
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';

    // Simple hash function (adjust as needed)
    let hash = 0;
    for (let i = 0; i < category.id.length; i++) {
        hash = category.id.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }

    // Map hash to a limited set of background utility classes from Tailwind Safelist or define here
    // Ensure these classes exist and are not purged by Tailwind
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


export function HeadlineTable({ headlines: initialHeadlines, categories, currentPage, totalPages, isBreakingNewsList = false }: HeadlineTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [headlines, setHeadlines] = useState(initialHeadlines); // Local state for reordering
  const { toast } = useToast();
  const { t } = useLanguage();

  const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.id, cat.name])), [categories]);

  // Update local headlines when initialHeadlines prop changes (e.g., due to filtering/pagination)
   // Use useEffect instead of useState initializer for prop updates
  useEffect(() => {
    setHeadlines(initialHeadlines);
    setSelectedIds(new Set()); // Clear selection when data changes
  }, [initialHeadlines]);


  const handleEdit = (headline: Headline) => {
    setEditingHeadline(headline);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Removed confirmation dialog
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingHeadline(null);
    // Revalidation happens via server action, no manual refresh needed normally
  };

  const getCategoryNames = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return t('noCategory'); // Handle case with no categories
    return categoryIds.map(id => categoryMap.get(id) || t('unknown')).join(', ');
  };

  const getBadgeVariant = (state: HeadlineState): "default" | "secondary" | "outline" | "destructive" => {
    switch (state) {
      case 'Approved': return 'default'; // Use primary color for Approved
      case 'In Review': return 'secondary'; // Use secondary color
      case 'Draft': return 'outline'; // Use outline style
      case 'Archived': return 'destructive'; // Use destructive color
      default: return 'outline';
    }
  }

  const getPriorityBadgeVariant = (priority: HeadlinePriority): "default" | "secondary" | "outline" | "destructive" => {
    // Use destructive for High priority, secondary for Normal
    return priority === 'High' ? 'destructive' : 'secondary';
  }

  // --- Selection Logic ---
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    // Convert indeterminate state to boolean equivalent for setting state
    const isChecked = checked === true;
    if (isChecked) {
      setSelectedIds(new Set(headlines.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean | 'indeterminate') => {
     // Convert indeterminate state to boolean equivalent for setting state
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

  const isAllSelected = headlines.length > 0 && selectedIds.size === headlines.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < headlines.length;

  // --- Bulk Actions ---
  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      const idsToDelete = Array.from(selectedIds);
      // Removed confirmation dialog
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

   const handleBulkStateChange = async (newState: HeadlineState) => {
       if (selectedIds.size === 0) return;
       const idsToUpdate = Array.from(selectedIds);
       try {
           await updateMultipleHeadlineStatesAction(idsToUpdate, newState);
           toast({
               title: t('headlinesStateUpdatedTitle'),
               // Ensure translation key exists and handles pluralization if needed
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

   const handleBulkExport = () => {
       if (selectedIds.size === 0) return;
       const idsToExport = Array.from(selectedIds);
       // Use existing export API, adding an 'ids' parameter
       const params = new URLSearchParams();
       // TODO: Get format/settings from Settings Context instead of hardcoding
       params.set('format', 'csv'); // Example: default to CSV
       params.set('ids', idsToExport.join(','));

       const exportUrl = `/api/export/headlines?${params.toString()}`;
       // Trigger download by navigating to the URL
       window.location.href = exportUrl;

       toast({ title: t('exportStartedTitle'), description: t('exportStartedDesc', { count: idsToExport.length }) });
       setSelectedIds(new Set()); // Clear selection
   }


  // --- Drag and Drop Logic ---
    const onDragEnd = async (result: DropResult) => {
        const { destination, source } = result; // Removed draggableId as it's less commonly needed directly here

        // Dropped outside the list or in the same position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        // Perform reorder optimistically in local state
        const newHeadlines = Array.from(headlines);
        const [reorderedItem] = newHeadlines.splice(source.index, 1);
        newHeadlines.splice(destination.index, 0, reorderedItem);

        // Update the 'order' property based on the new array index for VISIBLE items.
        // This is a simplified approach for client-side reordering presentation.
        // The backend action handles the actual persistent reordering logic based on IDs.
        const updatedHeadlinesWithVisualOrder = newHeadlines.map((headline, index) => ({
            ...headline,
            // This order property update is mainly for visual consistency if the component relies on it
            // The backend reorder relies on the ordered list of IDs
             order: (currentPage - 1) * 10 + index, // Example: Adjust based on pagination if needed locally
        }));

        setHeadlines(updatedHeadlinesWithVisualOrder);


        // Get the full list of IDs in the new order *from the updated local state*
        const orderedIdsOnPage = updatedHeadlinesWithVisualOrder.map(h => h.id);

        // NOTE: This implementation reorders ONLY the items visible on the current page.
        // A full cross-page reordering requires fetching ALL items matching filters,
        // applying the reorder logic globally, and then updating. This simplified version
        // sends the order of IDs *on the current page* to the backend.
        // The backend `reorderHeadlinesService` needs to handle this potentially partial list appropriately.

        try {
            // Send the ordered list of IDs for the current view to the backend action.
            await reorderHeadlinesAction(orderedIdsOnPage);
             toast({
                 title: t('reorderSuccessTitle'),
                 description: t('reorderSuccessDesc'),
            });
             // Data revalidation should happen via the server action's revalidatePath,
             // so no explicit client-side refresh is needed here after success.
        } catch (error) {
             console.error("Reorder failed:", error);
             toast({
                 title: t('error'),
                 description: t('reorderErrorDesc'),
                 variant: 'destructive',
             });
             // Revert local state to the initial state for this page if backend update fails
             setHeadlines(initialHeadlines);
        }
    };

  return (
    <>
      {/* Bulk Action Controls - Displayed only when items are selected */}
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
          }}
          // No need for value tracking if it's just triggering actions
          >
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
           {/* Bulk Delete Button - No Confirmation */}
           <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-9">
               <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0"/>
               {t('deleteSelected')}
           </Button>
        </div>
      )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="rounded-md border shadow-sm overflow-hidden"> {/* Ensure container handles overflow */}
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead padding="checkbox" className="w-10 sticky left-0 bg-background z-10"> {/* Sticky Checkbox */}
                    <Checkbox
                      checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAll}
                      aria-label={t('selectAllRows')}
                      className="translate-y-[2px]"
                    />
                  </TableHead>
                   <TableHead className="w-10 sticky left-10 bg-background z-10"></TableHead> {/* Sticky Drag Handle */}
                  <TableHead className="min-w-[250px]">{t('title')}</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">{t('category')}</TableHead>
                  <TableHead className="min-w-[100px]">{t('state')}</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[100px]">{t('priority')}</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[180px]">{t('publishDate')}</TableHead>
                  <TableHead className="w-16 sticky right-0 bg-background z-10"><span className="sr-only">{t('actions')}</span></TableHead> {/* Sticky Actions */}
                </TableRow>
              </TableHeader>
              <Droppable droppableId="headlines">
                {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {headlines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center"> {/* Adjusted colSpan */}
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
                                           "group", // Add group class for potential hover states
                                           getCategoryColorClass(headline.categories[0], categories), // Apply color based on first category
                                           snapshot.isDragging ? 'bg-primary/10 shadow-lg opacity-90' : '', // Style when dragging
                                           selectedIds.has(headline.id) ? 'bg-primary/5' : '' // Style when selected
                                        )}
                                        style={{
                                            ...providedDraggable.draggableProps.style // Apply styles from dnd
                                        }}
                                    >
                                        <TableCell padding="checkbox" className="sticky left-0 bg-inherit z-10"> {/* Sticky Checkbox */}
                                            <Checkbox
                                                checked={selectedIds.has(headline.id)}
                                                onCheckedChange={(checked) => handleSelectRow(headline.id, checked)}
                                                aria-label={t('selectRow')}
                                                className="translate-y-[2px]"
                                            />
                                        </TableCell>
                                         <TableCell
                                            padding="none"
                                            className="w-10 touch-none cursor-grab sticky left-10 bg-inherit z-10" // Sticky Drag Handle, explicit cursor
                                            {...providedDraggable.dragHandleProps} // Apply drag handle props here
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
                                    <TableCell className="w-16 sticky right-0 bg-inherit z-10"> {/* Sticky Actions */}
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

                                            {/* Removed AlertDialog wrapper for delete */}
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

      {/* Pagination - Conditionally render based on totalPages */}
      {totalPages > 1 && (
         <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}

      {/* Modal for Editing - Render conditionally */}
      {isModalOpen && editingHeadline && (
        <HeadlineEditorModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          headline={editingHeadline}
          categories={categories}
           // Pass isBreaking status if editing a breaking news item
          isBreaking={editingHeadline.isBreaking}
        />
      )}
      {/* Modal for Creating (if triggered differently) */}
       {isModalOpen && !editingHeadline && (
          <HeadlineEditorModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            headline={null} // Explicitly null for creation
            categories={categories}
            isBreaking={isBreakingNewsList} // Default based on the list type
          />
      )}
    </>
  );
}
