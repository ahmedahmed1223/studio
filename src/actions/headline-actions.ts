'use server';

import { revalidatePath } from 'next/cache';
import { createHeadline, updateHeadline, deleteHeadline, Headline } from '@/services/headline';
import { z } from 'zod';

// Define Zod schema matching the data structure for creation/update
// Reuse parts of the schema defined in the modal if possible, or redefine here for server validation
const headlineActionSchema = z.object({
  mainTitle: z.string().min(1),
  subtitle: z.string(),
  categories: z.array(z.string()).min(1),
  state: z.enum(['Draft', 'In Review', 'Approved', 'Archived']),
  priority: z.enum(['High', 'Normal']),
  displayLines: z.number().min(1).max(3),
  publishDate: z.date(),
});

// Type for the data expected by create/update actions
type HeadlineActionData = Omit<Headline, 'id'>;


export async function createHeadlineAction(data: HeadlineActionData) {
  // Validate data using Zod schema
  const validationResult = headlineActionSchema.safeParse(data);
  if (!validationResult.success) {
    // In a real app, you might want to return error details
    console.error("Validation failed:", validationResult.error.flatten());
    throw new Error('Invalid headline data provided.');
  }

  try {
    const newHeadlineId = await createHeadline(validationResult.data);
    revalidatePath('/dashboard'); // Revalidate the dashboard page cache
    return { success: true, id: newHeadlineId };
  } catch (error) {
    console.error('Failed to create headline:', error);
    // Consider returning a more specific error message
    throw new Error('Failed to create headline.');
  }
}

export async function updateHeadlineAction(id: string, data: Partial<HeadlineActionData>) {
 // Partially validate data: Allow partial updates but ensure types are correct
  const partialSchema = headlineActionSchema.partial();
  const validationResult = partialSchema.safeParse(data);

  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    throw new Error('Invalid headline data provided for update.');
  }

  try {
    await updateHeadline(id, validationResult.data);
    revalidatePath('/dashboard'); // Revalidate the dashboard page cache
    revalidatePath(`/headlines/${id}`); // If there's a detail page
    return { success: true };
  } catch (error) {
    console.error('Failed to update headline:', error);
    throw new Error('Failed to update headline.');
  }
}

export async function deleteHeadlineAction(id: string) {
  // Basic validation for ID
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID provided for deletion.');
  }

  try {
    await deleteHeadline(id);
    revalidatePath('/dashboard'); // Revalidate the dashboard page cache
    return { success: true };
  } catch (error) {
    console.error('Failed to delete headline:', error);
    throw new Error('Failed to delete headline.');
  }
}
