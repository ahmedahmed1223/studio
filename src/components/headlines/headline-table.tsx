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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { Pagination } from '@/components/common/pagination';
import { useState } from 'react';
import { HeadlineEditorModal } from './headline-editor-modal';
import { deleteHeadlineAction } from '@/actions/headline-actions'; // Server action for delete
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context'; // Import language context
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface HeadlineTableProps {
  headlines: Headline[];
  categories: Category[];
  currentPage: number;
  totalPages: number;
}

export function HeadlineTable({ headlines, categories, currentPage, totalPages }: HeadlineTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function

  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

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
      // Optionally, trigger a refresh of the data
      // router.refresh(); // Requires importing useRouter from next/navigation
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
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds.map(id => categoryMap.get(id) || 'Unknown').join(', ');
  };

  const getBadgeVariant = (state: HeadlineState): "default" | "secondary" | "outline" | "destructive" => {
    switch (state) {
      case 'Approved': return 'default'; // Use primary color (Teal)
      case 'In Review': return 'secondary';
      case 'Draft': return 'outline';
      case 'Archived': return 'destructive';
      default: return 'outline';
    }
  }

  const getPriorityBadgeVariant = (priority: HeadlinePriority): "default" | "secondary" | "outline" | "destructive" => {
    return priority === 'High' ? 'destructive' : 'secondary';
  }

  return (
    <>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('title')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('category')}</TableHead>
              <TableHead>{t('state')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('priority')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('publishDate')}</TableHead>
              <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headlines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t('noHeadlinesFound')}
                </TableCell>
              </TableRow>
            ) : (
              headlines.map((headline) => (
                <TableRow key={headline.id}>
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
                  <TableCell>
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
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent closing dropdown */}
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">{t('delete')}</span>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
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
