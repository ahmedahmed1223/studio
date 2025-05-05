
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { HeadlineEditorModal } from './headline-editor-modal';
import type { Category } from '@/services/headline';
import { useLanguage } from '@/context/language-context';

interface CreateHeadlineButtonProps {
    categories: Category[];
    isBreaking?: boolean; // Optional: To set the default for the modal's checkbox
}


export function CreateHeadlineButton({ categories, isBreaking = false }: CreateHeadlineButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpenModal} >
        <PlusCircle className="mr-2 h-4 w-4" />
        {/* Adjust button text if needed based on context */}
        {isBreaking ? t('createBreakingNews') : t('createHeadline')}
      </Button>

      <HeadlineEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        isBreaking={isBreaking} // Pass the isBreaking prop to the modal
        // headline prop is omitted for creation mode
      />
    </>
  );
}
