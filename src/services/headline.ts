
/**
 * @fileoverview This module simulates a backend service for managing headlines and categories.
 * It uses an in-memory array (`mockHeadlines`, `mockCategories`) to store data
 * and simulates network delays using `setTimeout`.
 * In a real application, these functions would interact with a database or external API.
 */

// --- Type Definitions ---

/**
 * Represents a headline category.
 */
export interface Category {
  /**
   * The unique identifier for the category (e.g., 'tech', 'sports').
   * Should be URL-friendly if used in routing.
   */
  id: string;
  /**
   * The display name of the category (e.g., 'Technology', 'Sports').
   */
  name: string;
}

/**
 * Represents the possible workflow states of a headline.
 * - `Draft`: Initial state, not visible.
 * - `In Review`: Submitted for approval.
 * - `Approved`: Ready for display/publication.
 * - `Archived`: No longer current, hidden from main lists.
 */
export type HeadlineState = 'Draft' | 'In Review' | 'Approved' | 'Archived';

/**
 * Represents the priority level of a headline, potentially affecting its visibility or placement.
 * - `High`: Indicates importance, might be displayed prominently.
 * - `Normal`: Standard priority.
 */
export type HeadlinePriority = 'High' | 'Normal';

/**
 * Represents a single news headline item.
 */
export interface Headline {
  /**
   * The unique identifier for the headline (e.g., 'headline-123').
   */
  id: string;
  /**
   * The main, primary title of the headline.
   */
  mainTitle: string;
  /**
   * An optional secondary title or summary.
   */
  subtitle: string;
  /**
   * An array of category IDs (`Category['id']`) that this headline belongs to.
   */
  categories: string[];
  /**
   * The current workflow state of the headline.
   */
  state: HeadlineState;
  /**
   * The priority level of the headline.
   */
  priority: HeadlinePriority;
  /**
   * Suggested number of lines for display purposes (e.g., 1, 2, or 3).
   * UI components can use this as a hint for text truncation.
   */
  displayLines: number;
  /**
   * The date and time when the headline is scheduled to be published or was published.
   */
  publishDate: Date;
  /**
   * Flag indicating if this is a breaking news item.
   */
  isBreaking: boolean;
  /**
   * A number representing the display order of the headline within its context.
   * Lower numbers typically appear first. This is managed by drag-and-drop functionality.
   */
  order: number;
}

// --- Mock Data Store ---
// Simulates a database table for categories.
let mockCategories: Category[] = [
  { id: 'tech', name: 'Technology' },
  { id: 'sports', name: 'Sports' },
  { id: 'business', name: 'Business' },
  { id: 'world', name: 'World News' },
  { id: 'local', name: 'Local Events' },
  { id: 'breaking', name: 'Breaking News' }, // Dedicated category ID for breaking news
];

// Simulates a database table for headlines with initial demo data.
let mockHeadlines: Headline[] = Array.from({ length: 25 }, (_, i) => {
    const stateIndex = i % 4;
    const priorityIndex = i % 2;
    const categoryIndex = i % (mockCategories.length -1); // Avoid assigning 'breaking' randomly initially
    const daysToAdd = Math.floor(Math.random() * 30); // Random publish date within 30 days
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() + daysToAdd);
    publishDate.setHours(hour, minute, 0, 0);
    const isBreaking = i % 7 === 0; // Make roughly 1 in 7 breaking news for demo

    return {
        id: `headline-${i + 1}`,
        mainTitle: `Headline ${i + 1}: ${isBreaking ? 'BREAKING' : 'News'} about topic ${i + 1}`,
        subtitle: `This is a subtitle for headline ${i + 1}, providing more context.`,
        // Assign categories, including 'breaking' if applicable
        categories: [
            mockCategories[categoryIndex].id,
            ...(i % 5 === 0 && categoryIndex > 0 ? [mockCategories[categoryIndex - 1].id] : []), // Add a second category sometimes
            ...(isBreaking ? ['breaking'] : []) // Add 'breaking' category ID if it's breaking news
        ].filter((value, index, self) => self.indexOf(value) === index), // Ensure unique categories
        state: ['Draft', 'In Review', 'Approved', 'Archived'][stateIndex] as HeadlineState,
        priority: ['Normal', 'High'][priorityIndex] as HeadlinePriority,
        displayLines: (i % 3) + 1 as 1 | 2 | 3, // Ensure type is 1, 2, or 3
        publishDate: publishDate,
        isBreaking: isBreaking,
        order: i, // Initial order based on creation index
    };
});

// Counters for generating unique IDs in the mock data.
let nextHeadlineId = mockHeadlines.length + 1;
let nextCategoryId = mockCategories.length + 1;
// --- End Mock Data Store ---


// --- Category Service Functions ---

/**
 * Asynchronously retrieves a list of all available categories.
 * Simulates an API call with a short delay.
 * @returns A promise that resolves to an array of `Category` objects. Returns a shallow copy of the internal data.
 */
export async function getCategories(): Promise<Category[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms network delay
  console.log('[Service] getCategories called');
  return [...mockCategories]; // Return a copy to prevent external mutation
}

/**
 * Asynchronously creates a new category.
 * Checks for duplicate names (case-insensitive) before adding.
 * Simulates an API call with a short delay.
 * @param name - The name for the new category. Must be unique (case-insensitive).
 * @returns A promise that resolves to the newly created `Category` object.
 * @throws {Error} If a category with the same name already exists.
 */
export async function createCategory(name: string): Promise<Category> {
     await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms delay
     const trimmedName = name.trim();
     // Check if name already exists (case-insensitive)
     if (mockCategories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
         console.error(`[Service] createCategory failed: Name "${trimmedName}" already exists.`);
         throw new Error(`Category with name "${trimmedName}" already exists.`);
     }
     // Generate a simple unique ID for the mock data
     const newId = `category-${nextCategoryId++}`;
     const newCategory: Category = { id: newId, name: trimmedName };
     mockCategories.push(newCategory);
     console.log("[Service] createCategory successful:", newCategory);
     return { ...newCategory }; // Return a copy
 }

/**
 * Asynchronously updates the name of an existing category.
 * Checks if the new name conflicts with another existing category (case-insensitive).
 * Simulates an API call with a short delay.
 * @param id - The ID of the category to update.
 * @param name - The new name for the category. Must be unique (case-insensitive) among other categories.
 * @returns A promise that resolves when the category is successfully updated.
 * @throws {Error} If the category ID is not found or if the new name conflicts with another category.
 */
export async function updateCategory(id: string, name: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms delay
     const index = mockCategories.findIndex(cat => cat.id === id);
     if (index === -1) {
         console.error(`[Service] updateCategory failed: ID "${id}" not found.`);
         throw new Error(`Category with ID ${id} not found.`);
     }
     const trimmedName = name.trim();
     // Check if new name conflicts with another existing category (case-insensitive)
     if (mockCategories.some(cat => cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase())) {
        console.error(`[Service] updateCategory failed: Name "${trimmedName}" conflicts with another category.`);
        throw new Error(`Another category with name "${trimmedName}" already exists.`);
     }
     mockCategories[index].name = trimmedName;
      console.log("[Service] updateCategory successful:", mockCategories[index]);
     return Promise.resolve();
 }

/**
 * Asynchronously deletes a category by its ID.
 * Also removes this category ID from the `categories` array of all headlines.
 * Simulates an API call with a slightly longer delay due to cascading effect.
 * @param id - The ID of the category to delete.
 * @returns A promise that resolves when the category (and its references in headlines) is deleted.
 *          Resolves even if the category ID was not found, but logs a warning.
 */
export async function deleteCategory(id: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay (cascade)
     const initialLength = mockCategories.length;
     mockCategories = mockCategories.filter(cat => cat.id !== id);

     if (mockCategories.length === initialLength) {
         console.warn(`[Service] deleteCategory: Category with ID "${id}" not found.`);
     } else {
        // Remove the category ID from all headlines
        mockHeadlines = mockHeadlines.map(headline => {
            const updatedCategories = headline.categories.filter(catId => catId !== id);
            // Return a new object only if categories changed
            return updatedCategories.length === headline.categories.length
                ? headline
                : { ...headline, categories: updatedCategories };
        });
        console.log(`[Service] deleteCategory successful: Deleted category ID "${id}" and removed from headlines.`);
     }
     return Promise.resolve();
 }


// --- Headline Service Functions ---

/**
 * Interface defining the available filters for retrieving headlines.
 * All properties are optional.
 */
export interface HeadlineFilters {
  /** Filter by one or more workflow states. */
  states?: HeadlineState[];
  /** Filter by a specific category ID. */
  category?: string;
  /** Filter by a search term matching mainTitle or subtitle (case-insensitive). */
  search?: string;
  /** Filter by breaking news status (true for breaking, false for non-breaking). */
  isBreaking?: boolean;
  /** Filter by a specific list of headline IDs (used for targeted export/actions). */
  ids?: string[];
}

/**
 * Interface for the structured result returned by `getHeadlines`.
 */
export interface GetHeadlinesResult {
  /** An array of `Headline` objects matching the filters and pagination. */
  headlines: Headline[];
  /** The total number of headlines matching the filters (before pagination). */
  totalCount: number;
}


/**
 * Asynchronously retrieves a list of headlines, supporting filtering, sorting by `order`, and pagination.
 * Simulates an API call with a delay.
 *
 * **Filtering Logic:**
 * - If `filters.ids` is provided, only headlines matching those IDs are returned, and other filters are ignored.
 * - Otherwise, applies `states`, `category`, `search`, and `isBreaking` filters cumulatively.
 * - Search is case-insensitive and checks both `mainTitle` and `subtitle`.
 *
 * **Sorting:** Headlines are always sorted by the `order` field in ascending order.
 *
 * **Pagination:**
 * - Applied only if `page > 0` and `pageSize > 0`.
 * - If `page` or `pageSize` is 0, or if filtering by `ids`, pagination is skipped, and all matching results are returned.
 *
 * @param filters - An optional `HeadlineFilters` object to filter the results.
 * @param page - The page number to retrieve (1-based). Defaults to 1. Use 0 to disable pagination.
 * @param pageSize - The number of headlines per page. Defaults to 10. Use 0 to disable pagination.
 * @returns A promise that resolves to a `GetHeadlinesResult` object containing the list of headlines and the total count.
 */
export async function getHeadlines(
  filters: HeadlineFilters = {}, // Default to empty object
  page: number = 1,
  pageSize: number = 10
): Promise<GetHeadlinesResult> {
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate 150ms network delay
  console.log('[Service] getHeadlines called with filters:', filters, `Page: ${page}, Size: ${pageSize}`);

  let filteredHeadlines = [...mockHeadlines]; // Start with a copy

  // Apply filters
  // 1. Filter by specific IDs if provided (overrides other filters)
  if (filters.ids && filters.ids.length > 0) {
      const idSet = new Set(filters.ids);
      filteredHeadlines = filteredHeadlines.filter(h => idSet.has(h.id));
      console.log(`[Service] Filtered by IDs: ${filters.ids.join(', ')}`);
  } else {
      // 2. Apply state filters
      if (filters.states && filters.states.length > 0) {
        const stateSet = new Set(filters.states);
        filteredHeadlines = filteredHeadlines.filter(h => stateSet.has(h.state));
        console.log(`[Service] Filtered by states: ${filters.states.join(', ')}`);
      }
      // 3. Apply category filter
      if (filters.category) {
        filteredHeadlines = filteredHeadlines.filter(h => h.categories.includes(filters.category!));
        console.log(`[Service] Filtered by category: ${filters.category}`);
      }
      // 4. Apply search term filter (case-insensitive)
       if (filters.search) {
           const searchTerm = filters.search.toLowerCase();
           filteredHeadlines = filteredHeadlines.filter(h =>
               h.mainTitle.toLowerCase().includes(searchTerm) ||
               h.subtitle.toLowerCase().includes(searchTerm)
           );
           console.log(`[Service] Filtered by search: "${filters.search}"`);
       }
       // 5. Apply breaking news filter
       if (filters.isBreaking !== undefined) {
           filteredHeadlines = filteredHeadlines.filter(h => h.isBreaking === filters.isBreaking);
           console.log(`[Service] Filtered by isBreaking: ${filters.isBreaking}`);
       }
   }

   // Sort by the 'order' field (ascending) - ensures consistent ordering
   filteredHeadlines.sort((a, b) => a.order - b.order);

   // Get total count *after* filtering but *before* pagination
   const totalCount = filteredHeadlines.length;
   console.log(`[Service] Total count after filtering: ${totalCount}`);

   // Apply pagination only if requested and not filtering by specific IDs
   let paginatedHeadlines = filteredHeadlines;
   const usePagination = page > 0 && pageSize > 0 && (!filters.ids || filters.ids.length === 0);

   if (usePagination) {
       const startIndex = (page - 1) * pageSize;
       const endIndex = startIndex + pageSize;
       paginatedHeadlines = filteredHeadlines.slice(startIndex, endIndex);
       console.log(`[Service] Applied pagination: page ${page}, size ${pageSize}. Returning ${paginatedHeadlines.length} items.`);
   } else {
        console.log(`[Service] Pagination skipped. Returning ${paginatedHeadlines.length} items.`);
   }


  return {
      headlines: paginatedHeadlines.map(h => ({ ...h })), // Return copies
      totalCount: totalCount,
  };
}


/**
 * Asynchronously retrieves a single headline by its ID.
 * Simulates an API call with a short delay.
 * @param id - The ID of the headline to retrieve.
 * @returns A promise that resolves to the `Headline` object if found, or `null` otherwise. Returns a shallow copy.
 */
export async function getHeadline(id: string): Promise<Headline | null> {
  await new Promise(resolve => setTimeout(resolve, 75)); // Simulate 75ms delay
  const headline = mockHeadlines.find(h => h.id === id);
  if (headline) {
      console.log(`[Service] getHeadline: Found ID "${id}"`);
      return { ...headline }; // Return a copy
  } else {
      console.log(`[Service] getHeadline: ID "${id}" not found.`);
      return null;
  }
}

/**
 * Asynchronously creates a new headline.
 * Assigns a unique ID and determines the initial `order` (placing it at the end).
 * Simulates an API call with a delay.
 * @param headlineData - The data for the new headline, excluding `id` and `order`.
 *                      Must include `mainTitle`, `categories`, `state`, `priority`, `displayLines`, `publishDate`, `isBreaking`.
 *                      `subtitle` is optional.
 * @returns A promise that resolves to the unique ID (`string`) of the newly created headline.
 */
export async function createHeadline(headlineData: Omit<Headline, 'id' | 'order'>): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay
  const newId = `headline-${nextHeadlineId++}`;
   // Assign the order to be the next available number, effectively placing it last.
  const maxOrder = mockHeadlines.reduce((max, h) => Math.max(max, h.order), -1);
  const newHeadline: Headline = {
    ...headlineData, // Spread the provided data
    subtitle: headlineData.subtitle || '', // Ensure subtitle is at least an empty string
    id: newId,
    order: maxOrder + 1, // Assign the next order number
  };
  mockHeadlines.push(newHeadline); // Add to the end of the main array
  console.log("[Service] createHeadline successful:", newHeadline)
  return newId;
}

/**
 * Asynchronously updates an existing headline with the provided data.
 * The `order` property cannot be updated using this function; use `reorderHeadlines` instead.
 * Simulates an API call with a delay.
 * @param id - The ID of the headline to update.
 * @param headlineUpdate - An object containing the fields to update. Can be a partial update.
 *                         Excludes `id`. `order` is ignored if present.
 * @returns A promise that resolves when the update is complete.
 * @throws {Error} If the headline ID is not found.
 */
export async function updateHeadline(id: string, headlineUpdate: Partial<Omit<Headline, 'id' | 'order'>>): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay
  const index = mockHeadlines.findIndex(h => h.id === id);
  if (index === -1) {
    console.error(`[Service] updateHeadline failed: ID "${id}" not found.`);
    throw new Error(`Headline with ID ${id} not found.`);
  }
  // Explicitly ignore 'order' if it was passed in headlineUpdate
  const { order, ...updateData } = headlineUpdate as Partial<Headline>; // Cast to include order for destructuring

  // Merge existing data with updateData
  mockHeadlines[index] = {
      ...mockHeadlines[index],
      ...updateData,
      // Ensure subtitle is not undefined if cleared
      subtitle: updateData.subtitle !== undefined ? updateData.subtitle : mockHeadlines[index].subtitle,
   };
   console.log("[Service] updateHeadline successful:", mockHeadlines[index])
  return Promise.resolve();
}


/**
 * Asynchronously updates the `order` property of headlines based on a provided list of IDs.
 * This function assumes the `orderedIds` represent the desired sequence for a specific subset
 * (e.g., items visible on a page after drag-and-drop). It updates the `order` property
 * in the mock data store for the affected headlines.
 * For a robust implementation, this might need the full context (all items) or handle conflicts.
 * Simulates an API call with a delay.
 *
 * @param orderedIds - An array of headline IDs (`string[]`) in the desired new sequence.
 * @returns A promise that resolves when the reordering process is complete in the mock store.
 */
export async function reorderHeadlines(orderedIds: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate 150ms delay for reorder

    // Create a map for quick lookup of the new order index for each ID provided.
    const newOrderMap = new Map(orderedIds.map((id, index) => [id, index]));

    // Update the order property ONLY for headlines present in the orderedIds list.
    // This assumes the backend can handle partial reordering or infer the full order.
    let updatedCount = 0;
    mockHeadlines.forEach(headline => {
        if (newOrderMap.has(headline.id)) {
            // Assign the new order based on the index in the provided list.
            // NOTE: This simplistic approach might lead to duplicate order numbers if not handled carefully
            // on the backend or if `orderedIds` doesn't represent the full context.
            // A better mock might involve calculating offsets based on the current page/filters.
            headline.order = newOrderMap.get(headline.id)!;
            updatedCount++;
        }
    });

    // IMPORTANT: After updating individual orders, re-sort the entire mockHeadlines array
    // to reflect the changes globally in the mock store.
    mockHeadlines.sort((a, b) => a.order - b.order);

    console.log(`[Service] reorderHeadlines: Updated order for ${updatedCount} headlines based on provided list. Full list re-sorted.`);
    // console.log("New order:", mockHeadlines.map(h => ({ id: h.id, order: h.order }))); // Optional: Log new order for debugging
    return Promise.resolve();
}


/**
 * Asynchronously deletes a headline by its ID.
 * Simulates an API call with a delay.
 * Does not reorder remaining headlines explicitly, assuming sorting handles gaps.
 * @param id - The ID of the headline to delete.
 * @returns A promise that resolves when the deletion is complete.
 *          Resolves even if the ID was not found, but logs a warning.
 */
export async function deleteHeadline(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 80)); // Simulate 80ms delay
  const initialLength = mockHeadlines.length;
  mockHeadlines = mockHeadlines.filter(h => h.id !== id);
  if (mockHeadlines.length === initialLength) {
    console.warn(`[Service] deleteHeadline: Headline with ID "${id}" not found.`);
  } else {
    console.log(`[Service] deleteHeadline successful: Deleted ID "${id}"`);
  }
  // No explicit reordering needed; sorting in getHeadlines handles presentation.
  return Promise.resolve();
}

// --- Bulk Headline Actions ---

/**
 * Asynchronously deletes multiple headlines based on an array of IDs.
 * Simulates an API call with a longer delay for bulk operations.
 * @param ids - An array of headline IDs (`string[]`) to delete.
 * @returns A promise that resolves when the deletion process is complete.
 */
export async function deleteMultipleHeadlines(ids: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate 200ms bulk delay
    const idSet = new Set(ids);
    const initialLength = mockHeadlines.length;
    mockHeadlines = mockHeadlines.filter(h => !idSet.has(h.id));
    const deletedCount = initialLength - mockHeadlines.length;
    console.log(`[Service] deleteMultipleHeadlines: Deleted ${deletedCount} headlines.`);
    return Promise.resolve();
}

/**
 * Asynchronously updates the workflow `state` for multiple headlines based on an array of IDs.
 * Simulates an API call with a longer delay for bulk operations.
 * @param ids - An array of headline IDs (`string[]`) to update.
 * @param state - The new `HeadlineState` to set for the specified headlines.
 * @returns A promise that resolves when the update process is complete.
 */
export async function updateMultipleHeadlineStates(ids: string[], state: HeadlineState): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate 200ms bulk delay
    const idSet = new Set(ids);
    let updatedCount = 0;
    mockHeadlines = mockHeadlines.map(h => {
        if (idSet.has(h.id)) {
            updatedCount++;
            // Return a new object with the updated state
            return { ...h, state: state };
        }
        // Return the original object if not updated
        return h;
    });
    console.log(`[Service] updateMultipleHeadlineStates: Updated state to "${state}" for ${updatedCount} headlines.`);
    return Promise.resolve();
}
