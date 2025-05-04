
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { HeadlineEditorModal } from './headline-editor-modal';
import type { Category } from '@/services/headline';
// import { getCategories } from '@/services/headline'; // No longer needed here
import { useLanguage } from '@/context/language-context'; // Import language context

interface CreateHeadlineButtonProps {
    categories: Category[]; // Accept categories as a prop
}


export function CreateHeadlineButton({ categories }: CreateHeadlineButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [categories, setCategories] = useState<Category[]>([]); // Categories now come from props
  // const [isLoadingCategories, setIsLoadingCategories] = useState(false); // No longer loading here
  const { t } = useLanguage(); // Get translation function

  const handleOpenModal = () => {
    // No need to fetch categories here anymore
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpenModal} >
        <PlusCircle className="mr-2 h-4 w-4" />
        {t('createHeadline')}
      </Button>

      {/* Ensure modal opens only when isModalOpen is true */}
      <HeadlineEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        // headline prop is omitted for creation mode
      />
    </>
  );
}
