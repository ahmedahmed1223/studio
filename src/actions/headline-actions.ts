
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

/**
 * Zod schema for validating headline data during creation and update actions.
 */
const headlineActionSchema = z.object({
  mainTitle: z.string().min(1, "Main title cannot be empty"),
  subtitle: z.string(),
  // content: z.string().optional(), // Uncomment if rich text content is added
  categories: z.array(z.string()).min(1, "At least one category is required"),
  state: z.enum(['Draft', 'In Review', 'Approved', 'Archived']),
  priority: z.enum(['High', 'Normal']),
  displayLines: z.number().min(1).max(3),
  publishDate: z.date(),
  isBreaking: z.boolean().default(false), // Default to false if not provided
});

/**
 * Type representing the data required to create a new headline.
 * Excludes 'id' and 'order' as they are handled by the service.
 */
export type HeadlineCreateData = z.infer<typeof headlineActionSchema>;

/**
 * Type representing the data allowed for updating an existing headline.
 * Allows partial updates and excludes 'id' and 'order'.
 */
export type HeadlineUpdateData = Partial<HeadlineCreateData>;


/**
 * Server action to create a new headline.
 * Validates the input data using `headlineActionSchema`.
 * Calls the `createHeadlineService` and revalidates relevant paths.
 *
 * @param data - The data for the new headline (conforming to `HeadlineCreateData`).
 * @returns An object indicating success and the ID of the new headline.
 * @throws {Error} If validation fails or the service call encounters an error.
 */
export async function createHeadlineAction(data: HeadlineCreateData) {
  // Validate data using Zod schema (excluding order)
  const validationResult = headlineActionSchema.safeParse(data);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    // Flatten errors for potentially better client-side display
    const errors = validationResult.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors).flat().join(', ');
    throw new Error(`Invalid headline data: ${errorMessages}`);
  }

  try {
    const newHeadlineId = await createHeadlineService(validationResult.data);
    revalidatePath('/dashboard'); // Revalidate the main headline list
    revalidatePath('/breaking-news'); // Revalidate the breaking news list
    return { success: true, id: newHeadlineId };
  } catch (error) {
    console.error('Failed to create headline:', error);
    throw new Error('Failed to create headline.'); // Rethrow a generic error
  }
}

/**
 * Server action to update an existing headline.
 * Validates the input data using a partial version of `headlineActionSchema`.
 * Calls the `updateHeadlineService` and revalidates relevant paths.
 *
 * @param id - The ID of the headline to update.
 * @param data - The partial data for the headline update (conforming to `HeadlineUpdateData`).
 * @returns An object indicating success.
 * @throws {Error} If validation fails or the service call encounters an error.
 */
export async function updateHeadlineAction(id: string, data: HeadlineUpdateData) {
 // Partially validate data: Allow partial updates but ensure types are correct (excluding order)
  const partialSchema = headlineActionSchema.partial();
  const validationResult = partialSchema.safeParse(data);

  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.flatten());
    const errors = validationResult.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors).flat().join(', ');
    throw new Error(`Invalid headline update data: ${errorMessages}`);
  }
  if (Object.keys(validationResult.data).length === 0) {
    // No actual data fields were provided for update
    return { success: true, message: 'No changes provided.' };
  }

  try {
    await updateHeadlineService(id, validationResult.data);
    revalidatePath('/dashboard');
    revalidatePath('/breaking-news');
    revalidatePath(`/headlines/${id}`); // If a detail page exists
    return { success: true };
  } catch (error) {
    console.error('Failed to update headline:', error);
    throw new Error('Failed to update headline.');
  }
}

/**
 * Server action to delete a headline.
 * Validates the headline ID.
 * Calls the `deleteHeadlineService` and revalidates relevant paths.
 *
 * @param id - The ID of the headline to delete.
 * @returns An object indicating success.
 * @throws {Error} If the ID is invalid or the service call encounters an error.
 */
export async function deleteHeadlineAction(id: string) {
  // Basic validation for ID
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID provided for deletion.');
  }

  try {
    await deleteHeadlineService(id);
    revalidatePath('/dashboard');
    revalidatePath('/breaking-news');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete headline:', error);
    throw new Error('Failed to delete headline.');
  }
}

/**
 * Server action to reorder headlines.
 * Validates the input array of ordered IDs.
 * Calls the `reorderHeadlinesService` and revalidates relevant paths.
 *
 * @param orderedIds - An array of headline IDs in the desired new order.
 * @returns An object indicating success.
 * @throws {Error} If the input is invalid or the service call encounters an error.
 */
export async function reorderHeadlinesAction(orderedIds: string[]) {
    // Basic validation
    if (!Array.isArray(orderedIds) || orderedIds.some(id => typeof id !== 'string')) {
        throw new Error('Invalid data provided for reordering. Expected an array of strings.');
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
 * Validates the input array of IDs.
 * Calls the `deleteMultipleHeadlinesService` and revalidates relevant paths.
 *
 * @param ids - Array of headline IDs to delete.
 * @returns An object indicating success.
 * @throws {Error} If the input is invalid or the service call encounters an error.
 */
export async function deleteMultipleHeadlinesAction(ids: string[]) {
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
        throw new Error('Invalid IDs provided for deletion. Expected an array of strings.');
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
 * Validates the input array of IDs and the target state.
 * Calls the `updateMultipleHeadlineStatesService` and revalidates relevant paths.
 *
 * @param ids - Array of headline IDs to update.
 * @param state - The new `HeadlineState` to set for the selected headlines.
 * @returns An object indicating success.
 * @throws {Error} If the input is invalid or the service call encounters an error.
 */
export async function updateMultipleHeadlineStatesAction(ids: string[], state: HeadlineState) {
     if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
        throw new Error('Invalid IDs provided for state update. Expected an array of strings.');
    }
    // Validate the state value against the allowed HeadlineState enum/type
    const validStates: HeadlineState[] = ['Draft', 'In Review', 'Approved', 'Archived'];
    if (!validStates.includes(state)) {
         throw new Error(`Invalid state provided: ${state}. Must be one of ${validStates.join(', ')}.`);
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

