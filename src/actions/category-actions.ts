
'use server';

import { revalidatePath } from 'next/cache';
import { createCategory, updateCategory, deleteCategory } from '@/services/headline';
import { z } from 'zod';

// Define Zod schema for category actions
const categoryNameSchema = z.string().min(1, { message: "Category name is required" }).max(50, { message: "Category name cannot exceed 50 characters" });

export async function createCategoryAction(name: string) {
  const validationResult = categoryNameSchema.safeParse(name);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    // Return specific error messages for better UX
    return { success: false, errors: validationResult.error.flatten().formErrors };
  }

  try {
    const newCategory = await createCategory(validationResult.data);
    revalidatePath('/dashboard'); // Revalidate dashboard where categories might be listed or used in filters
    revalidatePath('/settings'); // Revalidate settings page if categories are managed there
    return { success: true, category: newCategory };
  } catch (error: any) {
    console.error('Failed to create category:', error);
    return { success: false, errors: [error.message || 'Failed to create category.'] };
  }
}

export async function updateCategoryAction(id: string, name: string) {
  // Validate ID and name
  if (!id || typeof id !== 'string') {
    return { success: false, errors: ['Invalid category ID provided.'] };
  }
  const validationResult = categoryNameSchema.safeParse(name);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    return { success: false, errors: validationResult.error.flatten().formErrors };
  }

  try {
    await updateCategory(id, validationResult.data);
    revalidatePath('/dashboard');
    revalidatePath('/settings');
    // Also revalidate any headline detail pages if they display category names
    // This requires knowing the structure, e.g., revalidatePath(`/headlines/[id]`, 'page') or similar
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update category:', error);
     return { success: false, errors: [error.message || 'Failed to update category.'] };
  }
}

export async function deleteCategoryAction(id: string) {
  if (!id || typeof id !== 'string') {
     return { success: false, errors: ['Invalid category ID provided.'] };
  }

  try {
    await deleteCategory(id);
    revalidatePath('/dashboard');
    revalidatePath('/settings');
     // Also revalidate headline detail pages
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete category:', error);
     return { success: false, errors: [error.message || 'Failed to delete category.'] };
  }
}
