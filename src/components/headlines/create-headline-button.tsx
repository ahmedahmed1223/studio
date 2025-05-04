'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { HeadlineEditorModal } from './headline-editor-modal';
import type { Category } from '@/services/headline';
import { getCategories } from '@/services/headline'; // Assuming this is okay to call client-side or pre-fetched
import { useLanguage } from '@/context/language-context'; // Import language context

export function CreateHeadlineButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const { t } = useLanguage(); // Get translation function

  const handleOpenModal = async () => {
    setIsLoadingCategories(true);
    try {
      // Fetch categories when the modal is opened for the first time
      // Consider fetching categories at a higher level if this button is frequently used
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      // Handle error (e.g., show a toast message)
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpenModal} disabled={isLoadingCategories}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {isLoadingCategories ? t('loading') : t('createHeadline')}
      </Button>

      {isModalOpen && categories.length > 0 && (
        <HeadlineEditorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          categories={categories}
          // headline prop is omitted for creation mode
        />
      )}
    </>
  );
}
