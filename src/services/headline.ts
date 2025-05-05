
/**
 * @fileoverview This module simulates a backend service for managing headlines and categories.
 * It uses a local JSON file (`data/db.json`) to persist data across server restarts.
 * Simulates network delays using `setTimeout`.
 */

import fs from 'fs';
import path from 'path';

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
   * The date and time when the headline is scheduled to be published or was published. Stored as ISO string for JSON compatibility.
   */
  publishDate: string; // Changed to string for JSON persistence
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

// --- Data Persistence Setup ---

const dataDir = path.resolve(process.cwd(), 'data');
const dataFilePath = path.join(dataDir, 'db.json');

interface DbData {
  headlines: Headline[];
  categories: Category[];
  nextHeadlineId: number;
  nextCategoryId: number;
}

let dbData: DbData = {
    headlines: [],
    categories: [],
    nextHeadlineId: 1,
    nextCategoryId: 1,
};

// Function to generate initial mock data if file doesn't exist
function generateInitialData(): DbData {
    const initialCategories: Category[] = [
        { id: 'tech', name: 'Technology' },
        { id: 'sports', name: 'Sports' },
        { id: 'business', name: 'Business' },
        { id: 'world', name: 'World News' },
        { id: 'local', name: 'Local Events' },
        { id: 'breaking', name: 'Breaking News' },
    ];

    const initialHeadlines: Headline[] = Array.from({ length: 25 }, (_, i) => {
        const stateIndex = i % 4;
        const priorityIndex = i % 2;
        const categoryIndex = i % (initialCategories.length - 1); // Avoid assigning 'breaking' randomly initially
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
            categories: [
                initialCategories[categoryIndex].id,
                ...(i % 5 === 0 && categoryIndex > 0 ? [initialCategories[categoryIndex - 1].id] : []), // Add a second category sometimes
                ...(isBreaking ? ['breaking'] : []) // Add 'breaking' category ID if it's breaking news
            ].filter((value, index, self) => self.indexOf(value) === index), // Ensure unique categories
            state: ['Draft', 'In Review', 'Approved', 'Archived'][stateIndex] as HeadlineState,
            priority: ['Normal', 'High'][priorityIndex] as HeadlinePriority,
            displayLines: (i % 3) + 1 as 1 | 2 | 3,
            publishDate: publishDate.toISOString(), // Store as ISO string
            isBreaking: isBreaking,
            order: i, // Initial order based on creation index
        };
    });

    return {
        categories: initialCategories,
        headlines: initialHeadlines,
        nextCategoryId: initialCategories.length + 1,
        nextHeadlineId: initialHeadlines.length + 1,
    };
}


// Function to load data from JSON file
function loadData(): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
      console.log(`[Service] Data directory created at ${dataDir}`);
    }

    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      dbData = JSON.parse(fileContent);
      // Ensure date strings are converted back to Date objects if needed elsewhere,
      // but keep as string for the service functions dealing with dbData directly.
      console.log(`[Service] Data loaded successfully from ${dataFilePath}`);
    } else {
      console.log(`[Service] Data file not found at ${dataFilePath}. Generating initial data.`);
      dbData = generateInitialData();
      saveData(); // Save the initial data
    }
  } catch (error) {
    console.error('[Service] Error loading or generating data:', error);
    // Fallback to in-memory initial data if loading/saving fails critically
    dbData = generateInitialData();
  }
}

// Function to save data to JSON file
function saveData(): void {
  try {
    const dataString = JSON.stringify(dbData, null, 2); // Pretty print JSON
    fs.writeFileSync(dataFilePath, dataString, 'utf-8');
    // console.log(`[Service] Data saved successfully to ${dataFilePath}`); // Log less frequently
  } catch (error) {
    console.error('[Service] Error saving data:', error);
  }
}

// Load data when the service module is initialized
loadData();

// --- Helper function to get Date objects from string ---
// Use this when returning data *outside* the service if Date objects are preferred
function parseHeadlineDates(headline: Headline): Headline & { publishDate: Date } {
    return {
        ...headline,
        publishDate: new Date(headline.publishDate),
    };
}

// --- Category Service Functions ---

/**
 * Asynchronously retrieves a list of all available categories.
 * @returns A promise that resolves to an array of `Category` objects. Returns a shallow copy of the internal data.
 */
export async function getCategories(): Promise<Category[]> {
  await new Promise(resolve => setTimeout(resolve, 20)); // Simulate tiny delay
  console.log('[Service] getCategories called');
  return [...dbData.categories]; // Return a copy
}

/**
 * Asynchronously creates a new category.
 * Checks for duplicate names (case-insensitive) before adding.
 * Saves the updated data to the JSON file.
 * @param name - The name for the new category. Must be unique (case-insensitive).
 * @returns A promise that resolves to the newly created `Category` object.
 * @throws {Error} If a category with the same name already exists.
 */
export async function createCategory(name: string): Promise<Category> {
     await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms delay
     const trimmedName = name.trim();
     // Check if name already exists (case-insensitive)
     if (dbData.categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
         console.error(`[Service] createCategory failed: Name "${trimmedName}" already exists.`);
         throw new Error(`Category with name "${trimmedName}" already exists.`);
     }
     // Generate a simple unique ID for the mock data
     const newId = `category-${dbData.nextCategoryId++}`;
     const newCategory: Category = { id: newId, name: trimmedName };
     dbData.categories.push(newCategory);
     saveData(); // Persist changes
     console.log("[Service] createCategory successful:", newCategory);
     return { ...newCategory }; // Return a copy
 }

/**
 * Asynchronously updates the name of an existing category.
 * Checks if the new name conflicts with another existing category (case-insensitive).
 * Saves the updated data to the JSON file.
 * @param id - The ID of the category to update.
 * @param name - The new name for the category. Must be unique (case-insensitive) among other categories.
 * @returns A promise that resolves when the category is successfully updated.
 * @throws {Error} If the category ID is not found or if the new name conflicts with another category.
 */
export async function updateCategory(id: string, name: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms delay
     const index = dbData.categories.findIndex(cat => cat.id === id);
     if (index === -1) {
         console.error(`[Service] updateCategory failed: ID "${id}" not found.`);
         throw new Error(`Category with ID ${id} not found.`);
     }
     const trimmedName = name.trim();
     // Check if new name conflicts with another existing category (case-insensitive)
     if (dbData.categories.some(cat => cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase())) {
        console.error(`[Service] updateCategory failed: Name "${trimmedName}" conflicts with another category.`);
        throw new Error(`Another category with name "${trimmedName}" already exists.`);
     }
     dbData.categories[index].name = trimmedName;
     saveData(); // Persist changes
     console.log("[Service] updateCategory successful:", dbData.categories[index]);
     return Promise.resolve();
 }

/**
 * Asynchronously deletes a category by its ID.
 * Also removes this category ID from the `categories` array of all headlines.
 * Saves the updated data to the JSON file.
 * @param id - The ID of the category to delete.
 * @returns A promise that resolves when the category (and its references in headlines) is deleted.
 *          Resolves even if the category ID was not found, but logs a warning.
 */
export async function deleteCategory(id: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay (cascade)
     const initialLength = dbData.categories.length;
     dbData.categories = dbData.categories.filter(cat => cat.id !== id);

     if (dbData.categories.length === initialLength) {
         console.warn(`[Service] deleteCategory: Category with ID "${id}" not found.`);
     } else {
        // Remove the category ID from all headlines
        dbData.headlines = dbData.headlines.map(headline => {
            const updatedCategories = headline.categories.filter(catId => catId !== id);
            // Return a new object only if categories changed
            return updatedCategories.length === headline.categories.length
                ? headline
                : { ...headline, categories: updatedCategories };
        });
        saveData(); // Persist changes
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
 * Dates are returned as Date objects.
 */
export interface GetHeadlinesResult {
  /** An array of `Headline` objects matching the filters and pagination, with Date objects. */
  headlines: Array<Headline & { publishDate: Date }>; // Return with Date objects
  /** The total number of headlines matching the filters (before pagination). */
  totalCount: number;
}


/**
 * Asynchronously retrieves a list of headlines, supporting filtering, sorting by `order`, and pagination.
 * Reads data from the JSON file representation.
 *
 * **Filtering Logic:** (Same as before)
 * **Sorting:** Headlines are always sorted by the `order` field in ascending order.
 * **Pagination:** (Same as before)
 * **Date Handling:** Converts stored ISO date strings back to Date objects before returning.
 *
 * @param filters - An optional `HeadlineFilters` object to filter the results.
 * @param page - The page number to retrieve (1-based). Defaults to 1. Use 0 to disable pagination.
 * @param pageSize - The number of headlines per page. Defaults to 10. Use 0 to disable pagination.
 * @returns A promise that resolves to a `GetHeadlinesResult` object containing the list of headlines (with Dates) and the total count.
 */
export async function getHeadlines(
  filters: HeadlineFilters = {}, // Default to empty object
  page: number = 1,
  pageSize: number = 10
): Promise<GetHeadlinesResult> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay
  console.log('[Service] getHeadlines called with filters:', filters, `Page: ${page}, Size: ${pageSize}`);

  let filteredHeadlines = [...dbData.headlines]; // Start with a copy from dbData

  // Apply filters (logic remains the same as before)
   if (filters.ids && filters.ids.length > 0) {
       const idSet = new Set(filters.ids);
       filteredHeadlines = filteredHeadlines.filter(h => idSet.has(h.id));
   } else {
       if (filters.states && filters.states.length > 0) {
         const stateSet = new Set(filters.states);
         filteredHeadlines = filteredHeadlines.filter(h => stateSet.has(h.state));
       }
       if (filters.category) {
         filteredHeadlines = filteredHeadlines.filter(h => h.categories.includes(filters.category!));
       }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredHeadlines = filteredHeadlines.filter(h =>
                h.mainTitle.toLowerCase().includes(searchTerm) ||
                h.subtitle.toLowerCase().includes(searchTerm)
            );
        }
        if (filters.isBreaking !== undefined) {
            filteredHeadlines = filteredHeadlines.filter(h => h.isBreaking === filters.isBreaking);
        }
    }

   // Sort by the 'order' field (ascending)
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
   }

  // Convert date strings to Date objects before returning
  const headlinesWithDates = paginatedHeadlines.map(parseHeadlineDates);

  return {
      headlines: headlinesWithDates, // Return headlines with Date objects
      totalCount: totalCount,
  };
}


/**
 * Asynchronously retrieves a single headline by its ID.
 * Converts the date string to a Date object upon retrieval.
 * @param id - The ID of the headline to retrieve.
 * @returns A promise that resolves to the `Headline` object (with Date) if found, or `null` otherwise.
 */
export async function getHeadline(id: string): Promise<(Headline & { publishDate: Date }) | null> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms delay
  const headline = dbData.headlines.find(h => h.id === id);
  if (headline) {
      console.log(`[Service] getHeadline: Found ID "${id}"`);
      return parseHeadlineDates(headline); // Return with Date object
  } else {
      console.log(`[Service] getHeadline: ID "${id}" not found.`);
      return null;
  }
}

/**
 * Type for creating headlines, accepting Date object for publishDate.
 */
export type HeadlineCreateInput = Omit<Headline, 'id' | 'order' | 'publishDate'> & { publishDate: Date };

/**
 * Asynchronously creates a new headline.
 * Converts the `publishDate` Date object to an ISO string for storage.
 * Assigns a unique ID and determines the initial `order`.
 * Saves the updated data to the JSON file.
 * @param headlineData - The data for the new headline, with `publishDate` as a Date object.
 * @returns A promise that resolves to the unique ID (`string`) of the newly created headline.
 */
export async function createHeadline(headlineData: HeadlineCreateInput): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay
  const newId = `headline-${dbData.nextHeadlineId++}`;
  const maxOrder = dbData.headlines.reduce((max, h) => Math.max(max, h.order), -1);
  const newHeadline: Headline = {
    ...headlineData, // Spread the provided data
    subtitle: headlineData.subtitle || '', // Ensure subtitle is at least an empty string
    publishDate: headlineData.publishDate.toISOString(), // Convert Date to ISO string
    id: newId,
    order: maxOrder + 1, // Assign the next order number
  };
  dbData.headlines.push(newHeadline); // Add to the end
  saveData(); // Persist changes
  console.log("[Service] createHeadline successful:", newHeadline)
  return newId;
}

/**
 * Type for updating headlines, accepting Date object or string for publishDate.
 */
export type HeadlineUpdateInput = Partial<Omit<Headline, 'id' | 'order' | 'publishDate'>> & { publishDate?: Date | string };

/**
 * Asynchronously updates an existing headline.
 * Converts `publishDate` to ISO string if provided as a Date object.
 * The `order` property cannot be updated using this function.
 * Saves the updated data to the JSON file.
 * @param id - The ID of the headline to update.
 * @param headlineUpdate - An object containing the fields to update. `publishDate` can be Date or string.
 * @returns A promise that resolves when the update is complete.
 * @throws {Error} If the headline ID is not found.
 */
export async function updateHeadline(id: string, headlineUpdate: HeadlineUpdateInput): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay
  const index = dbData.headlines.findIndex(h => h.id === id);
  if (index === -1) {
    console.error(`[Service] updateHeadline failed: ID "${id}" not found.`);
    throw new Error(`Headline with ID ${id} not found.`);
  }
  // Explicitly ignore 'order' if present
  const { order, ...updateData } = headlineUpdate as Partial<Headline>;

  // Prepare data for merging, converting Date to string if necessary
  const dataToMerge: Partial<Headline> = { ...updateData };
  if (updateData.publishDate instanceof Date) {
      dataToMerge.publishDate = updateData.publishDate.toISOString();
  } else if (typeof updateData.publishDate === 'string') {
      // If it's already a string, assume it's a valid ISO string (or handle validation if needed)
      dataToMerge.publishDate = updateData.publishDate;
  }

  // Merge existing data with updateData
  dbData.headlines[index] = {
      ...dbData.headlines[index],
      ...dataToMerge,
      // Ensure subtitle is not undefined if cleared
      subtitle: dataToMerge.subtitle !== undefined ? dataToMerge.subtitle : dbData.headlines[index].subtitle,
   };
   saveData(); // Persist changes
   console.log("[Service] updateHeadline successful:", dbData.headlines[index])
  return Promise.resolve();
}


/**
 * Asynchronously updates the `order` property of headlines based on a provided list of IDs.
 * Saves the updated data to the JSON file after reordering.
 * @param orderedIds - An array of headline IDs (`string[]`) in the desired new sequence.
 * @returns A promise that resolves when the reordering process is complete.
 */
export async function reorderHeadlines(orderedIds: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate 150ms delay

    const newOrderMap = new Map(orderedIds.map((id, index) => [id, index]));
    let updatedCount = 0;
    // Find the minimum current order among the items being reordered to use as a base
    let minCurrentOrder = Infinity;
     dbData.headlines.forEach(headline => {
         if (newOrderMap.has(headline.id)) {
             minCurrentOrder = Math.min(minCurrentOrder, headline.order);
         }
     });

     // Ensure minCurrentOrder is valid
     if (minCurrentOrder === Infinity) minCurrentOrder = 0;

     // Update order based on the new map, adding the base offset
    dbData.headlines.forEach(headline => {
        if (newOrderMap.has(headline.id)) {
            // Assign new order relative to the start of the dragged group
            headline.order = minCurrentOrder + newOrderMap.get(headline.id)!;
            updatedCount++;
        }
    });

    // Re-sort the entire list to correctly place the reordered items and handle potential gaps/duplicates
    dbData.headlines.sort((a, b) => a.order - b.order);

    // Renumber all items sequentially after sorting to ensure clean order numbers
    dbData.headlines.forEach((headline, index) => {
        headline.order = index;
    });


    saveData(); // Persist changes
    console.log(`[Service] reorderHeadlines: Updated order for ${updatedCount} headlines. Full list re-sorted and renumbered.`);
    return Promise.resolve();
}


/**
 * Asynchronously deletes a headline by its ID.
 * Saves the updated data to the JSON file.
 * @param id - The ID of the headline to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteHeadline(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 80)); // Simulate 80ms delay
  const initialLength = dbData.headlines.length;
  dbData.headlines = dbData.headlines.filter(h => h.id !== id);
  if (dbData.headlines.length < initialLength) {
    saveData(); // Persist changes
    console.log(`[Service] deleteHeadline successful: Deleted ID "${id}"`);
  } else {
    console.warn(`[Service] deleteHeadline: Headline with ID "${id}" not found.`);
  }
  return Promise.resolve();
}

// --- Bulk Headline Actions ---

/**
 * Asynchronously deletes multiple headlines based on an array of IDs.
 * Saves the updated data to the JSON file.
 * @param ids - An array of headline IDs (`string[]`) to delete.
 * @returns A promise that resolves when the deletion process is complete.
 */
export async function deleteMultipleHeadlines(ids: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate 200ms bulk delay
    const idSet = new Set(ids);
    const initialLength = dbData.headlines.length;
    dbData.headlines = dbData.headlines.filter(h => !idSet.has(h.id));
    const deletedCount = initialLength - dbData.headlines.length;
    if (deletedCount > 0) {
        saveData(); // Persist changes
    }
    console.log(`[Service] deleteMultipleHeadlines: Deleted ${deletedCount} headlines.`);
    return Promise.resolve();
}

/**
 * Asynchronously updates the workflow `state` for multiple headlines based on an array of IDs.
 * Saves the updated data to the JSON file.
 * @param ids - An array of headline IDs (`string[]`) to update.
 * @param state - The new `HeadlineState` to set for the specified headlines.
 * @returns A promise that resolves when the update process is complete.
 */
export async function updateMultipleHeadlineStates(ids: string[], state: HeadlineState): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate 200ms bulk delay
    const idSet = new Set(ids);
    let updatedCount = 0;
    dbData.headlines = dbData.headlines.map(h => {
        if (idSet.has(h.id) && h.state !== state) { // Only update if state is different
            updatedCount++;
            return { ...h, state: state };
        }
        return h;
    });
    if (updatedCount > 0) {
        saveData(); // Persist changes
    }
    console.log(`[Service] updateMultipleHeadlineStates: Updated state to "${state}" for ${updatedCount} headlines.`);
    return Promise.resolve();
}
