
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/language-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/actions/category-actions';
import type { Category } from '@/services/headline';

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesUpdate: () => void; // Callback to refresh categories list in parent
}

export function CategoryManager({ categories, onCategoriesUpdate }: CategoryManagerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of category being deleted

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
        toast({ title: t('error'), description: t('categoryNameRequired'), variant: 'destructive' });
        return;
    }
    setIsAdding(true);
    const result = await createCategoryAction(newCategoryName.trim());
    setIsAdding(false);

    if (result.success) {
      toast({ title: t('categoryCreatedTitle'), description: t('categoryCreatedDesc', { name: newCategoryName.trim() }) });
      setNewCategoryName('');
      onCategoriesUpdate(); // Refresh list
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
     if (!editingCategoryName.trim()) {
        toast({ title: t('error'), description: t('categoryNameRequired'), variant: 'destructive' });
        return;
     }
     setIsEditing(true);
     const result = await updateCategoryAction(id, editingCategoryName.trim());
     setIsEditing(false);

     if (result.success) {
        toast({ title: t('categoryUpdatedTitle'), description: t('categoryUpdatedDesc', { name: editingCategoryName.trim() }) });
        setEditingCategoryId(null);
        setEditingCategoryName('');
        onCategoriesUpdate(); // Refresh list
     } else {
        toast({ title: t('error'), description: result.errors?.join(', ') || t('categoryUpdateError'), variant: 'destructive' });
     }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteCategoryAction(id);
    setIsDeleting(null);

    if (result.success) {
      toast({ title: t('categoryDeletedTitle'), description: t('categoryDeletedDesc') });
      onCategoriesUpdate(); // Refresh list
    } else {
       toast({ title: t('error'), description: result.errors?.join(', ') || t('categoryDeleteError'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Category Input */}
      <div className="flex gap-2">
        <Input
          placeholder={t('newCategoryPlaceholder')}
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          disabled={isAdding}
          aria-label={t('newCategoryPlaceholder')}
        />
        <Button onClick={handleAddCategory} disabled={isAdding || !newCategoryName.trim()}>
          <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {isAdding ? t('adding') : t('addCategory')}
        </Button>
      </div>

      {/* Categories Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('categoryName')}</TableHead>
              <TableHead className="w-[120px] text-right rtl:text-left">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  {t('noCategoriesFound')}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {editingCategoryId === category.id ? (
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        disabled={isEditing}
                        aria-label={t('editCategoryNameLabel', { name: category.name })}
                      />
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell className="text-right rtl:text-left">
                    {editingCategoryId === category.id ? (
                      <div className="flex justify-end gap-1 rtl:justify-start">
                        <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(category.id)} disabled={isEditing || !editingCategoryName.trim()} aria-label={t('saveCategoryName')}>
                          <Save className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit} disabled={isEditing} aria-label={t('cancelEdit')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1 rtl:justify-start">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)} aria-label={t('editCategory')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={isDeleting === category.id} aria-label={t('deleteCategory')}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>{t('confirmDeleteCategoryTitle')}</AlertDialogTitle>
                               <AlertDialogDescription>
                                 {t('confirmDeleteCategoryDesc', { name: category.name })}
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => handleDeleteCategory(category.id)}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 disabled={isDeleting === category.id}
                                >
                                 {isDeleting === category.id ? t('deleting') : t('deleteConfirm')}
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
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
