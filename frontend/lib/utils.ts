import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx for conditional class composition.
 * Standard shadcn/ui utility.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
