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
import { MoreHorizontal, Edit, Trash2, GripVertical } from 'lucide-react';
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
import { useState, useMemo } from 'react';
import { HeadlineEditorModal } from './headline-editor-modal';
import { deleteHeadlineAction, updateHeadlineAction, reorderHeadlinesAction, deleteMultipleHeadlinesAction, updateMultipleHeadlineStatesAction } from '@/actions/headline-actions'; // Import actions
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; // Use hello-pangea fork for React 18+
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

    // Map hash to a limited set of background utility classes
    const colorIndex = Math.abs(hash) % 5; // 5 example colors
    switch (colorIndex) {
        case 0: return 'bg-blue-50 dark:bg-blue-900/20';
        case 1: return 'bg-green-50 dark:bg-green-900/20';
        case 2: return 'bg-yellow-50 dark:bg-yellow-900/20';
        case 3: return 'bg-purple-50 dark:bg-purple-900/20';
        case 4: return 'bg-red-50 dark:bg-red-900/20';
        default: return '';
    }
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
  useState(() => {
    setHeadlines(initialHeadlines);
    setSelectedIds(new Set()); // Clear selection when data changes
  }, [initialHeadlines]);


  const handleEdit = (headline: Headline) => {
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
      // Update local state after deletion
      setHeadlines(prev => prev.filter(h => h.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      // No full refresh needed if only updating local state
    } catch (error) {
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
    // Note: We don't refresh the whole table here. The action should revalidate.
    // If optimistic updates are needed, update `headlines` state here.
  };

  const getCategoryNames = (categoryIds: string[]) => {
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
    if (checked === true) {
      setSelectedIds(new Set(headlines.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean | 'indeterminate') => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked === true) {
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
               description: t('headlinesStateUpdatedDesc', { count: idsToUpdate.length, state: t(newState.toLowerCase().replace(' ', '')) }),
           });
           // Update local state
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
       // Add other export settings from context/state if needed (format, etc.)
       params.set('format', 'csv'); // Example: default to CSV or get from settings
       params.set('ids', idsToExport.join(','));

       const exportUrl = `/api/export/headlines?${params.toString()}`;
       // Trigger download
       window.location.href = exportUrl;
       // Consider showing a toast notification
       toast({ title: t('exportStartedTitle'), description: t('exportStartedDesc', { count: idsToExport.length }) });
       setSelectedIds(new Set()); // Clear selection
   }


  // --- Drag and Drop Logic ---
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Dropped outside the list or in the same position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        // Perform reorder optimistically in local state
        const newHeadlines = Array.from(headlines);
        const [reorderedItem] = newHeadlines.splice(source.index, 1);
        newHeadlines.splice(destination.index, 0, reorderedItem);

        // Update order property based on new array index
        const updatedHeadlinesWithOrder = newHeadlines.map((headline, index) => ({
            ...headline,
            order: index, // Re-assign order based on new position in the current view
        }));

        setHeadlines(updatedHeadlinesWithOrder);


        // Get the full list of IDs in the new order *for the current page*
        const orderedIdsOnPage = updatedHeadlinesWithOrder.map(h => h.id);

        // TODO: For full reordering across pages, need to fetch ALL headlines matching current filters,
        // reorder them based on the drag operation, and then update the order for ALL affected items.
        // This is complex and requires careful handling of pagination and filters.
        // For this example, we'll only update the order based on the *current page's* visible items.
        // A more robust solution might involve a dedicated reordering mode or different API.

        try {
            // Send the *entire ordered list of IDs* for the current view to the backend
             // Adjust this logic if implementing full cross-page reordering
            await reorderHeadlinesAction(orderedIdsOnPage); // Pass the ordered IDs of the current page
             toast({
                 title: t('reorderSuccessTitle'),
                 description: t('reorderSuccessDesc'),
            });
             // No need to refresh from server if optimistic update is reliable
        } catch (error) {
             console.error("Reorder failed:", error);
             toast({
                 title: t('error'),
                 description: t('reorderErrorDesc'),
                 variant: 'destructive',
             });
             // Revert local state if backend update fails
             setHeadlines(initialHeadlines); // Revert to original order for this page
        }
    };

  return (
    <>
      {/* Bulk Action Controls */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-4 p-4 bg-muted rounded-md">
          <span className="text-sm font-medium">
             {t('selectedCount', { count: selectedIds.size })}
          </span>
          <Select onValueChange={(value) => {
              if (value === 'delete') {
                 // Trigger confirmation dialog for bulk delete
              } else if (value === 'export') {
                  handleBulkExport();
              } else if (['Draft', 'In Review', 'Approved', 'Archived'].includes(value)) {
                  handleBulkStateChange(value as HeadlineState);
              }
          }}
          value="" // Reset value after selection
          >
              <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('bulkActionsPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="export">{t('exportSelected')}</SelectItem>
                  <DropdownMenuSeparator/>
                  <SelectItem value="Approved">{t('setStateTo', { state: t('approved')})}</SelectItem>
                  <SelectItem value="In Review">{t('setStateTo', { state: t('inreview')})}</SelectItem>
                  <SelectItem value="Draft">{t('setStateTo', { state: t('draft')})}</SelectItem>
                  <SelectItem value="Archived">{t('setStateTo', { state: t('archived')})}</SelectItem>
                  <DropdownMenuSeparator/>
                   {/* Add AlertDialogTrigger for Delete */}
                   <AlertDialog>
                        <AlertDialogTrigger asChild>
                             {/* Need a way to select "delete" without closing the Select */}
                             {/* Option 1: Use a button styled like a SelectItem */}
                             {/* Option 2: Handle in onValueChange and show dialog */}
                             <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive">
                                {t('deleteSelected')}
                             </div>

                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmBulkDeleteTitle', { count: selectedIds.size })}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('confirmBulkDeleteDesc', { count: selectedIds.size })}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleBulkDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {t('deleteConfirm')}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
              </SelectContent>
          </Select>
        </div>
      )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="rounded-md border shadow-sm overflow-hidden"> {/* Added overflow-hidden */}
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead padding="checkbox" className="w-10"> {/* Checkbox column */}
                    <Checkbox
                      checked={isAllSelected || isIndeterminate}
                      onCheckedChange={handleSelectAll}
                      aria-label={t('selectAllRows')}
                      className="translate-y-[2px]"
                      indeterminate={isIndeterminate} // Add indeterminate state
                    />
                  </TableHead>
                   <TableHead className="w-10"></TableHead> {/* Drag handle column */}
                  <TableHead>{t('title')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('category')}</TableHead>
                  <TableHead>{t('state')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('priority')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('publishDate')}</TableHead>
                  <TableHead className="w-16"><span className="sr-only">{t('actions')}</span></TableHead>
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
                                {(provided, snapshot) => (
                                    <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        // {...provided.dragHandleProps} // Drag handle is now a separate element
                                        key={headline.id}
                                        data-state={selectedIds.has(headline.id) ? 'selected' : undefined}
                                        className={cn(
                                           getCategoryColorClass(headline.categories[0], categories), // Apply color based on first category
                                           snapshot.isDragging ? 'bg-muted shadow-lg' : ''
                                        )}
                                        style={{
                                            ...provided.draggableProps.style // Apply styles from dnd
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                            checked={selectedIds.has(headline.id)}
                                            onCheckedChange={(checked) => handleSelectRow(headline.id, checked)}
                                            aria-label={t('selectRow')}
                                            className="translate-y-[2px]"
                                            />
                                        </TableCell>
                                         <TableCell padding="none" className="w-10 touch-none" {...provided.dragHandleProps}> {/* Drag handle cell */}
                                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                        </TableCell>
                                    <TableCell className="font-medium">
                                        <div>{headline.mainTitle}</div>
                                        <div className="text-sm text-muted-foreground">{headline.subtitle}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{getCategoryNames(headline.categories)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getBadgeVariant(headline.state)}>{t(headline.state.toLowerCase().replace(' ', ''))}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant={getPriorityBadgeVariant(headline.priority)}>{t(headline.priority.toLowerCase())}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{format(headline.publishDate, 'PPp')}</TableCell>
                                    <TableCell className="w-16">
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">{t('openMenu')}</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(headline)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>{t('edit')}</span>
                                            </DropdownMenuItem>

                                            <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>{t('delete')}</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('confirmDeleteDesc')}
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(headline.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    {t('deleteConfirm')}
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                            </AlertDialog>

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

      {totalPages > 1 && !isBreakingNewsList && ( // Don't show pagination for breaking news list if it's separate
         <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}

      {/* Modal for Editing */}
      {editingHeadline && (
        <HeadlineEditorModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          headline={editingHeadline}
          categories={categories}
        />
      )}
    </>
  );
}

// Type needed for react-beautiful-dnd
interface DropResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  reason: 'DROP' | 'CANCEL';
}
