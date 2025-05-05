

/**
 * Represents a headline category.
 */
export interface Category {
  /**
   * The unique identifier for the category.
   */
  id: string;
  /**
   * The name of the category.
   */
  name: string;
}

/**
 * Represents the state of a headline.
 */
export type HeadlineState = 'Draft' | 'In Review' | 'Approved' | 'Archived';

/**
 * Represents a headline's priority.
 */
export type HeadlinePriority = 'High' | 'Normal';

/**
 * Represents a headline.
 */
export interface Headline {
  /**
   * The unique identifier for the headline.
   */
  id: string;
  /**
   * The main title of the headline.
   */
  mainTitle: string;
  /**
   * The subtitle of the headline.
   */
  subtitle: string;
  /**
   * The categories the headline belongs to (array of category IDs).
   */
  categories: string[];
  /**
   * The state of the headline.
   */
  state: HeadlineState;
  /**
   * The priority of the headline.
   */
  priority: HeadlinePriority;
  /**
   * The number of display lines for the headline.
   */
  displayLines: number;
  /**
   * The scheduled publish date/time for the headline.
   */
  publishDate: Date;
  /**
   * Indicates if the headline is breaking news.
   */
  isBreaking: boolean;
  /**
   * The display order of the headline. Lower numbers appear first.
   */
  order: number;
}

// --- Mock Data Store ---
let mockCategories: Category[] = [
  { id: 'tech', name: 'Technology' },
  { id: 'sports', name: 'Sports' },
  { id: 'business', name: 'Business' },
  { id: 'world', name: 'World News' },
  { id: 'local', name: 'Local Events' },
  { id: 'breaking', name: 'Breaking News' }, // Added dedicated category for simpler mapping if needed
];

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
        mainTitle: `Headline ${i + 1}: ${isBreaking ? 'BREAKING' : 'News'} about topic ${i}`,
        subtitle: `This is a short subtitle explaining more about headline ${i + 1}. It provides context for event ${i}.`,
        categories: [
            mockCategories[categoryIndex].id,
            ...( i % 5 === 0 && categoryIndex > 0 ? [mockCategories[categoryIndex-1].id] : []),
            ...(isBreaking ? ['breaking'] : []) // Add breaking category if it's breaking
        ],
        state: ['Draft', 'In Review', 'Approved', 'Archived'][stateIndex] as HeadlineState,
        priority: ['Normal', 'High'][priorityIndex] as HeadlinePriority,
        displayLines: (i % 3) + 1,
        publishDate: publishDate,
        isBreaking: isBreaking,
        order: i, // Initial order based on creation index
    };
});

let nextHeadlineId = mockHeadlines.length + 1;
let nextCategoryId = mockCategories.length + 1; // For new categories
// --- End Mock Data Store ---


/**
 * Asynchronously retrieves a list of categories.
 * Simulates API delay.
 * @returns A promise that resolves to an array of Category objects.
 */
export async function getCategories(): Promise<Category[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  return [...mockCategories]; // Return a copy
}

/**
 * Interface for headline filters.
 */
export interface HeadlineFilters {
  states?: HeadlineState[];
  category?: string;
  search?: string;
  isBreaking?: boolean; // Added filter for breaking news
  ids?: string[]; // Added filter for specific IDs (used by export)
}

/**
 * Interface for the result of getHeadlines.
 */
export interface GetHeadlinesResult {
  headlines: Headline[];
  totalCount: number;
}


/**
 * Asynchronously retrieves a list of headlines with filtering, sorting, and pagination.
 * Simulates API delay.
 * @param filters An object containing optional filters.
 * @param page The page number to retrieve (1-based). Set to 0 for all results.
 * @param pageSize The number of headlines per page. Set to 0 for all results.
 * @returns A promise that resolves to an object containing the headlines for the page and the total count of filtered headlines.
 */
export async function getHeadlines(
  filters?: HeadlineFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<GetHeadlinesResult> {
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay

  let filteredHeadlines = [...mockHeadlines]; // Start with a copy

  // Apply filters
  if (filters?.ids && filters.ids.length > 0) {
      const idSet = new Set(filters.ids);
      filteredHeadlines = filteredHeadlines.filter(h => idSet.has(h.id));
  } else {
      // Apply other filters only if not filtering by specific IDs
      if (filters?.states && filters.states.length > 0) {
        const stateSet = new Set(filters.states);
        filteredHeadlines = filteredHeadlines.filter(h => stateSet.has(h.state));
      }
      if (filters?.category) {
        filteredHeadlines = filteredHeadlines.filter(h => h.categories.includes(filters.category!));
      }
       if (filters?.search) {
           const searchTerm = filters.search.toLowerCase();
           filteredHeadlines = filteredHeadlines.filter(h =>
               h.mainTitle.toLowerCase().includes(searchTerm) ||
               h.subtitle.toLowerCase().includes(searchTerm)
           );
       }
       if (filters?.isBreaking !== undefined) {
           filteredHeadlines = filteredHeadlines.filter(h => h.isBreaking === filters.isBreaking);
       }
   }

   // Sort by order field (ascending)
   filteredHeadlines.sort((a, b) => a.order - b.order);

   // Get total count *after* filtering
   const totalCount = filteredHeadlines.length;

  // Apply pagination only if page and pageSize are positive and not fetching by IDs
   let paginatedHeadlines = filteredHeadlines;
   if (page > 0 && pageSize > 0 && (!filters?.ids || filters.ids.length === 0)) {
       const startIndex = (page - 1) * pageSize;
       const endIndex = startIndex + pageSize;
       paginatedHeadlines = filteredHeadlines.slice(startIndex, endIndex);
   }

  return {
      headlines: paginatedHeadlines, // Return copies to prevent direct mutation
      totalCount: totalCount,
  };
}


/**
 * Asynchronously retrieves a single headline by ID.
 * Simulates API delay.
 * @param id The ID of the headline to retrieve.
 * @returns A promise that resolves to a Headline object, or null if not found.
 */
export async function getHeadline(id: string): Promise<Headline | null> {
  await new Promise(resolve => setTimeout(resolve, 75)); // Simulate network delay
  const headline = mockHeadlines.find(h => h.id === id);
  return headline ? { ...headline } : null; // Return a copy or null
}

/**
 * Asynchronously creates a new headline.
 * Simulates API delay and adds to the mock store.
 * @param headline The headline data to create (without ID, order). Order is automatically assigned.
 * @returns A promise that resolves to the ID of the newly created headline.
 */
export async function createHeadline(headline: Omit<Headline, 'id' | 'order'>): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  const newId = `headline-${nextHeadlineId++}`;
   // Assign a high order number initially, assuming new items go to the end
  const maxOrder = mockHeadlines.reduce((max, h) => Math.max(max, h.order), -1);
  const newHeadline: Headline = {
    ...headline,
    id: newId,
    order: maxOrder + 1, // Place at the end
  };
  mockHeadlines.push(newHeadline); // Add to the end of the array
  console.log("Created headline:", newHeadline)
  return newId;
}

/**
 * Asynchronously updates an existing headline.
 * Simulates API delay and updates the mock store.
 * @param id The ID of the headline to update.
 * @param headlineUpdate The partial headline data to update.
 * @returns A promise that resolves when the headline has been updated, or rejects if not found.
 */
export async function updateHeadline(id: string, headlineUpdate: Partial<Omit<Headline, 'id'>>): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  const index = mockHeadlines.findIndex(h => h.id === id);
  if (index === -1) {
    throw new Error(`Headline with ID ${id} not found.`);
  }
  // Prevent direct update of order via this function; use reorder for that
  const { order, ...updateData } = headlineUpdate;
  mockHeadlines[index] = { ...mockHeadlines[index], ...updateData };
   console.log("Updated headline:", mockHeadlines[index])
  return;
}


/**
 * Asynchronously updates the order of multiple headlines.
 * Simulates API delay and updates the mock store.
 * @param orderedIds An array of headline IDs in the desired new order.
 * @returns A promise that resolves when the headlines have been reordered.
 */
export async function reorderHeadlines(orderedIds: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay for reorder
    const newOrderMap = new Map(orderedIds.map((id, index) => [id, index]));

    // Update the order property for each headline based on the new map
    mockHeadlines.forEach(headline => {
        if (newOrderMap.has(headline.id)) {
            headline.order = newOrderMap.get(headline.id)!;
        }
    });

    // Optionally re-sort the main mockHeadlines array by the new order
    mockHeadlines.sort((a, b) => a.order - b.order);

    console.log("Reordered headlines. New order:", mockHeadlines.map(h => ({ id: h.id, order: h.order })));
    return;
}


/**
 * Asynchronously deletes a headline.
 * Simulates API delay and removes from the mock store.
 * @param id The ID of the headline to delete.
 * @returns A promise that resolves when the headline has been deleted.
 */
export async function deleteHeadline(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 80)); // Simulate network delay
  const initialLength = mockHeadlines.length;
  mockHeadlines = mockHeadlines.filter(h => h.id !== id);
  if (mockHeadlines.length === initialLength) {
    // Optional: Throw error if ID didn't exist, or just resolve silently
    // throw new Error(`Headline with ID ${id} not found for deletion.`);
  }
   console.log("Deleted headline with ID:", id)
   // No need to explicitly reorder after deletion, gaps are handled by sorting
  return;
}

// --- Bulk Actions ---

/**
 * Asynchronously deletes multiple headlines.
 * @param ids Array of headline IDs to delete.
 * @returns A promise that resolves when headlines are deleted.
 */
export async function deleteMultipleHeadlines(ids: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate bulk delay
    const idSet = new Set(ids);
    const initialLength = mockHeadlines.length;
    mockHeadlines = mockHeadlines.filter(h => !idSet.has(h.id));
    console.log(`Deleted ${initialLength - mockHeadlines.length} headlines.`);
    // No need to explicitly reorder after deletion
    return;
}

/**
 * Asynchronously updates the state of multiple headlines.
 * @param ids Array of headline IDs to update.
 * @param state The new state to set.
 * @returns A promise that resolves when headlines are updated.
 */
export async function updateMultipleHeadlineStates(ids: string[], state: HeadlineState): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate bulk delay
    const idSet = new Set(ids);
    let updatedCount = 0;
    mockHeadlines.forEach(h => {
        if (idSet.has(h.id)) {
            h.state = state;
            updatedCount++;
        }
    });
    console.log(`Updated state to "${state}" for ${updatedCount} headlines.`);
    return;
}


// --- Category Management ---

/**
 * Asynchronously adds a new category.
 * @param name The name of the new category.
 * @returns A promise that resolves to the newly created Category object.
 */
export async function createCategory(name: string): Promise<Category> {
     await new Promise(resolve => setTimeout(resolve, 50));
     // More robust ID generation (simple counter for mock)
     const newId = `category-${nextCategoryId++}`;
     // Check if name already exists (case-insensitive)
     if (mockCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
         throw new Error(`Category with name "${name}" already exists.`);
     }
     const newCategory: Category = { id: newId, name };
     mockCategories.push(newCategory);
     console.log("Created category:", newCategory);
     return { ...newCategory }; // Return a copy
 }

/**
 * Asynchronously updates an existing category.
 * @param id The ID of the category to update.
 * @param name The new name for the category.
 * @returns A promise that resolves when the category is updated.
 */
export async function updateCategory(id: string, name: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 50));
     const index = mockCategories.findIndex(cat => cat.id === id);
     if (index === -1) {
         throw new Error(`Category with ID ${id} not found.`);
     }
     // Check if new name conflicts with another existing category (case-insensitive)
     if (mockCategories.some(cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`Another category with name "${name}" already exists.`);
     }
     mockCategories[index].name = name;
      console.log("Updated category:", mockCategories[index]);
     return;
 }

/**
 * Asynchronously deletes a category. Also removes the category from all headlines.
 * @param id The ID of the category to delete.
 * @returns A promise that resolves when the category is deleted.
 */
export async function deleteCategory(id: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 100)); // Slightly longer delay for cascade
     const initialLength = mockCategories.length;
     mockCategories = mockCategories.filter(cat => cat.id !== id);

     if (mockCategories.length === initialLength) {
         // Optional: Consider if not finding the category should be an error
         console.warn(`Category with ID ${id} not found for deletion.`);
     } else {
        // Remove the category ID from all headlines that contain it
        mockHeadlines = mockHeadlines.map(headline => ({
            ...headline,
            categories: headline.categories.filter(catId => catId !== id),
        }));
        console.log(`Deleted category with ID: ${id} and removed from headlines.`);
     }

     return;
 }
