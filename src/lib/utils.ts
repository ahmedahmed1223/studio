
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// Note: use-debounce is typically used within components, not directly in utils.
// If you need debounce functionality here, you might be looking for a general debounce function.
// Example:
// export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
//   let timeout: NodeJS.Timeout | null = null;
//   return (...args: Parameters<T>) => {
//     if (timeout) {
//       clearTimeout(timeout);
//     }
//     timeout = setTimeout(() => {
//       func(...args);
//     }, wait);
//   };
// }


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
