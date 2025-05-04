
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
}

// --- Mock Data Store ---
let mockCategories: Category[] = [
  { id: 'tech', name: 'Technology' },
  { id: 'sports', name: 'Sports' },
  { id: 'business', name: 'Business' },
  { id: 'world', name: 'World News' },
  { id: 'local', name: 'Local Events' },
];

let mockHeadlines: Headline[] = Array.from({ length: 25 }, (_, i) => {
    const stateIndex = i % 4;
    const priorityIndex = i % 2;
    const categoryIndex = i % mockCategories.length;
    const daysToAdd = Math.floor(Math.random() * 30); // Random publish date within 30 days
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() + daysToAdd);
    publishDate.setHours(hour, minute, 0, 0);

    return {
        id: `headline-${i + 1}`,
        mainTitle: `Headline ${i + 1}: Breaking News`,
        subtitle: `This is a short subtitle explaining more about headline ${i + 1}. It provides context.`,
        categories: [mockCategories[categoryIndex].id, ...( i % 5 === 0 && categoryIndex > 0 ? [mockCategories[categoryIndex-1].id] : [])], // Add a second category sometimes
        state: ['Draft', 'In Review', 'Approved', 'Archived'][stateIndex] as HeadlineState,
        priority: ['Normal', 'High'][priorityIndex] as HeadlinePriority,
        displayLines: (i % 3) + 1,
        publishDate: publishDate,
    };
});

let nextHeadlineId = mockHeadlines.length + 1;
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
 * Asynchronously retrieves a list of headlines with filtering and pagination.
 * Simulates API delay.
 * @param filters An object containing optional filters for state and category.
 * @param page The page number to retrieve (1-based).
 * @param pageSize The number of headlines per page.
 * @returns A promise that resolves to an array of Headline objects for the requested page.
 */
export async function getHeadlines(
  filters?: { state?: HeadlineState; category?: string },
  page: number = 1,
  pageSize: number = 10
): Promise<Headline[]> {
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay

  let filteredHeadlines = [...mockHeadlines]; // Start with a copy

  // Apply filters
  if (filters?.state) {
    filteredHeadlines = filteredHeadlines.filter(h => h.state === filters.state);
  }
  if (filters?.category) {
    filteredHeadlines = filteredHeadlines.filter(h => h.categories.includes(filters.category!));
  }

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedHeadlines = filteredHeadlines.slice(startIndex, endIndex);

  // TODO: In a real API, you'd also return the total count of filtered items for pagination UI.
  // For now, the caller assumes a fixed total or calculates it based on the full unfiltered list.

  return paginatedHeadlines;
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
 * @param headline The headline data to create (without ID).
 * @returns A promise that resolves to the ID of the newly created headline.
 */
export async function createHeadline(headline: Omit<Headline, 'id'>): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  const newId = `headline-${nextHeadlineId++}`;
  const newHeadline: Headline = {
    ...headline,
    id: newId,
  };
  mockHeadlines.unshift(newHeadline); // Add to the beginning of the array
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
  mockHeadlines[index] = { ...mockHeadlines[index], ...headlineUpdate };
   console.log("Updated headline:", mockHeadlines[index])
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
     const newId = name.toLowerCase().replace(/\s+/g, '-'); // Simple ID generation
     // Check if ID already exists, handle collision if necessary in a real app
     if (mockCategories.some(cat => cat.id === newId)) {
         throw new Error(`Category with derived ID ${newId} already exists.`);
     }
     const newCategory: Category = { id: newId, name };
     mockCategories.push(newCategory);
     console.log("Created category:", newCategory);
     return { ...newCategory };
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
     mockCategories[index].name = name;
      console.log("Updated category:", mockCategories[index]);
     return;
 }

/**
 * Asynchronously deletes a category.
 * Note: This mock implementation does not handle removing the category from existing headlines.
 * @param id The ID of the category to delete.
 * @returns A promise that resolves when the category is deleted.
 */
export async function deleteCategory(id: string): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 50));
     mockCategories = mockCategories.filter(cat => cat.id !== id);
      console.log("Deleted category with ID:", id);
     // In a real app, you'd need a strategy for headlines associated with the deleted category.
     return;
 }
