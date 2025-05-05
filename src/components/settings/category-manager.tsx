
'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Import React
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/language-context';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction, getCategoriesAction } from '@/actions/category-actions'; // Import getCategoriesAction
import type { Category } from '@/services/headline';
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @fileoverview Component for managing headline categories.
 * Allows creating, editing, and deleting categories. Fetches categories via server action.
 */

// No longer needs categories passed as props
interface CategoryManagerProps {
  // Removed props: categories, onCategoriesUpdate, isLoading, error
}

export function CategoryManager({}: CategoryManagerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of category being deleted

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getCategoriesAction(); // Use server action
      if (fetchedCategories.success && fetchedCategories.categories) {
        setCategories(fetchedCategories.categories);
      } else {
          throw new Error(fetchedCategories.errors?.join(', ') || t('categoryFetchError'));
      }
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      setError(err.message || t('categoryFetchError'));
      toast({
          title: t('error'),
          description: err.message || t('categoryFetchError'),
          variant: 'destructive'
      });
      setCategories([]); // Clear categories on error
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]); // Dependencies for fetchCategories

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
        toast({ title: t('error'), description: t('categoryNameRequired'), variant: 'destructive' });
        return;
    }
    setIsAdding(true);
    const result = await createCategoryAction(trimmedName);
    setIsAdding(false);

    if (result.success && result.category) {
      toast({ title: t('categoryCreatedTitle'), description: t('categoryCreatedDesc', { name: result.category.name }) });
      setNewCategoryName('');
      fetchCategories(); // Refresh list by re-fetching
    } else {
      toast({ title: t('error'), description: result.errors?.join(', ') || t('categoryCreateError'), variant: 'destructive' });
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveEdit = async (id: string) => {
     const trimmedName = editingCategoryName.trim();
     if (!trimmedName) {
        toast({ title: t('error'), description: t('categoryNameRequired'), variant: 'destructive' });
        return;
     }
     // Prevent saving if name hasn't changed
     const originalCategory = categories.find(cat => cat.id === id);
     if (originalCategory && originalCategory.name === trimmedName) {
         handleCancelEdit(); // Just close the edit UI
         return;
     }

     setIsEditing(true);
     const result = await updateCategoryAction(id, trimmedName);
     setIsEditing(false);

     if (result.success) {
        toast({ title: t('categoryUpdatedTitle'), description: t('categoryUpdatedDesc', { name: trimmedName }) });
        setEditingCategoryId(null);
        setEditingCategoryName('');
        fetchCategories(); // Refresh list
     } else {
        toast({ title: t('error'), description: result.errors?.join(', ') || t('categoryUpdateError'), variant: 'destructive' });
     }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteCategoryAction(id);
    setIsDeleting(null); // Reset deleting state regardless of outcome

    if (result.success) {
      toast({ title: t('categoryDeletedTitle'), description: t('categoryDeletedDesc') });
      fetchCategories(); // Refresh list
       // If the deleted category was being edited, cancel the edit
      if (editingCategoryId === id) {
          handleCancelEdit();
      }
    } else {
       toast({ title: t('error'), description: result.errors?.join(', ') || t('categoryDeleteError'), variant: 'destructive' });
    }
  };

   // Handle Enter key press in input fields
   const handleAddKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
       if (event.key === 'Enter') {
           handleAddCategory();
       }
   };
    const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (event.key === 'Enter') {
            handleSaveEdit(id);
        } else if (event.key === 'Escape') {
            handleCancelEdit();
        }
    };

  return (
    <div className="space-y-4">
      {/* Add Category Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder={t('newCategoryPlaceholder')}
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={handleAddKeyDown}
          disabled={isAdding || isLoading} // Disable during loading as well
          aria-label={t('newCategoryPlaceholder')}
          className="flex-grow"
        />
        <Button onClick={handleAddCategory} disabled={isAdding || isLoading || !newCategoryName.trim()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {isAdding ? t('adding') : t('addCategory')}
        </Button>
      </div>

       {/* Error Display */}
      {error && !isLoading && <p className="text-sm text-destructive">{error}</p>}

      {/* Categories Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('categoryName')}</TableHead>
              <TableHead className="w-[100px] text-right rtl:text-left">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                 // Loading Skeleton Rows
                 Array.from({ length: 3 }).map((_, index) => (
                     <TableRow key={`skeleton-${index}`}>
                         <TableCell>
                             <Skeleton className="h-5 w-3/4" />
                         </TableCell>
                         <TableCell className="text-right rtl:text-left">
                              <div className="flex justify-end gap-1 rtl:justify-start">
                                 <Skeleton className="h-8 w-8" />
                                 <Skeleton className="h-8 w-8" />
                             </div>
                         </TableCell>
                     </TableRow>
                 ))
             ) : categories.length === 0 && !error ? (
                 // No Categories Found Message
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  {t('noCategoriesFound')}
                </TableCell>
              </TableRow>
            ) : (
                // Actual Category Rows
              categories.map((category) => (
                <TableRow key={category.id} className={isDeleting === category.id ? 'opacity-50' : ''}>
                  <TableCell>
                    {editingCategoryId === category.id ? (
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, category.id)}
                        disabled={isEditing}
                        autoFocus // Focus input when editing starts
                        aria-label={t('editCategoryNameLabel', { name: category.name })}
                      />
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell className="text-right rtl:text-left">
                    {editingCategoryId === category.id ? (
                      <div className="flex justify-end gap-1 rtl:justify-start">
                        <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(category.id)} disabled={isEditing || !editingCategoryName.trim()} aria-label={t('saveCategoryName')} title={t('saveCategoryName')}>
                          <Save className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit} disabled={isEditing} aria-label={t('cancelEdit')} title={t('cancelEdit')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1 rtl:justify-start">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)} aria-label={t('editCategory')} title={t('editCategory')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={isDeleting === category.id}
                            aria-label={t('deleteCategory')}
                            title={t('deleteCategory')}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                         >
                           {isDeleting === category.id ? (
                                <span className="animate-spin h-4 w-4 border-b-2 border-current rounded-full"></span> // Simple spinner
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                         </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
