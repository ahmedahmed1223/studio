
'use server';

import { revalidatePath } from 'next/cache';
import {
    createHeadline as createHeadlineService,
    updateHeadline as updateHeadlineService,
    deleteHeadline as deleteHeadlineService,
    reorderHeadlines as reorderHeadlinesService,
    deleteMultipleHeadlines as deleteMultipleHeadlinesService,
    updateMultipleHeadlineStates as updateMultipleHeadlineStatesService,
    Headline,
    HeadlineState
} from '@/services/headline';
import { z } from 'zod';

// Define Zod schema matching the data structure for creation/update
// Reusing parts of the schema defined in the modal
const headlineActionSchema = z.object({
  mainTitle: z.string().min(1),
  subtitle: z.string(),
  categories: z.array(z.string()).min(1),
  state: z.enum(['Draft', 'In Review', 'Approved', 'Archived']),
  priority: z.enum(['High', 'Normal']),
  displayLines: z.number().min(1).max(3),
  publishDate: z.date(),
  isBreaking: z.boolean().optional(), // Added isBreaking
});

// Type for the data expected by create action (order is handled by service)
type HeadlineCreateData = Omit<Headline, 'id' | 'order'>;
// Type for the data expected by update action (order is handled by reorder action)
type HeadlineUpdateData = Partial<Omit<Headline, 'id' | 'order'>>;


export async function createHeadlineAction(data: HeadlineCreateData) {
  // Validate data using Zod schema (excluding order)
  const validationResult = headlineActionSchema.safeParse(data);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    throw new Error('Invalid headline data provided.');
  }

  try {
    const newHeadlineId = await createHeadlineService(validationResult.data);
    revalidatePath('/dashboard'); // Revalidate the dashboard page cache
    revalidatePath('/breaking-news'); // Revalidate breaking news if relevant
    return { success: true, id: newHeadlineId };
  } catch (error) {
    console.error('Failed to create headline:', error);
    throw new Error('Failed to create headline.');
  }
}

export async function updateHeadlineAction(id: string, data: HeadlineUpdateData) {
 // Partially validate data: Allow partial updates but ensure types are correct (excluding order)
  const partialSchema = headlineActionSchema.partial();
  const validationResult = partialSchema.safeParse(data);

  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    throw new Error('Invalid headline data provided for update.');
  }

  try {
    await updateHeadlineService(id, validationResult.data);
    revalidatePath('/dashboard'); // Revalidate the dashboard page cache
    revalidatePath('/breaking-news'); // Revalidate breaking news if relevant
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
    await deleteHeadlineService(id);
    revalidatePath('/dashboard'); // Revalidate the dashboard page cache
    revalidatePath('/breaking-news');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete headline:', error);
    throw new Error('Failed to delete headline.');
  }
}

/**
 * Server action to reorder headlines.
 * @param orderedIds An array of headline IDs in the desired new order.
 */
export async function reorderHeadlinesAction(orderedIds: string[]) {
    // Basic validation
    if (!Array.isArray(orderedIds) || orderedIds.some(id => typeof id !== 'string')) {
        throw new Error('Invalid data provided for reordering.');
    }

    try {
        await reorderHeadlinesService(orderedIds);
        revalidatePath('/dashboard'); // Revalidate lists where order matters
        revalidatePath('/breaking-news');
        return { success: true };
    } catch (error) {
        console.error('Failed to reorder headlines:', error);
        throw new Error('Failed to reorder headlines.');
    }
}


/**
 * Server action to delete multiple headlines.
 * @param ids Array of headline IDs to delete.
 */
export async function deleteMultipleHeadlinesAction(ids: string[]) {
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
        throw new Error('Invalid IDs provided for deletion.');
    }
     if (ids.length === 0) {
        return { success: true, message: 'No headlines selected for deletion.' }; // Nothing to do
    }

    try {
        await deleteMultipleHeadlinesService(ids);
        revalidatePath('/dashboard');
        revalidatePath('/breaking-news');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete multiple headlines:', error);
        throw new Error('Failed to delete headlines.');
    }
}

/**
 * Server action to update the state of multiple headlines.
 * @param ids Array of headline IDs to update.
 * @param state The new state to set.
 */
export async function updateMultipleHeadlineStatesAction(ids: string[], state: HeadlineState) {
     if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
        throw new Error('Invalid IDs provided for state update.');
    }
    if (!['Draft', 'In Review', 'Approved', 'Archived'].includes(state)) {
         throw new Error('Invalid state provided.');
    }
     if (ids.length === 0) {
        return { success: true, message: 'No headlines selected for state update.' };
    }


    try {
        await updateMultipleHeadlineStatesService(ids, state);
        revalidatePath('/dashboard');
        revalidatePath('/breaking-news');
        return { success: true };
    } catch (error) {
        console.error('Failed to update multiple headline states:', error);
        throw new Error('Failed to update headline states.');
    }
}
