import { type ClassValue } from "clsx";
import { cn } from "./utils";

/**
 * Utility functions for working with the theme system
 */

/**
 * Get theme-aware classes for status indicators
 */
export const getStatusClasses = (status: 'success' | 'warning' | 'error' | 'info') => {
  const baseClasses = "px-2 py-1 rounded-md text-sm font-medium";
  
  switch (status) {
    case 'success':
      return cn(baseClasses, "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900 dark:text-green-100");
    case 'warning':
      return cn(baseClasses, "bg-yellow-100 text-yellow-900 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100");
    case 'error':
      return cn(baseClasses, "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900 dark:text-red-100");
    case 'info':
      return cn(baseClasses, "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900 dark:text-blue-100");
    default:
      return cn(baseClasses, "bg-secondary text-secondary-foreground");
  }
};

/**
 * Get theme-aware classes for transaction amounts (positive/negative)
 */
export const getAmountClasses = (amount: number, ...additionalClasses: ClassValue[]) => {
  const baseClasses = "font-medium";
  const colorClass = amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  
  return cn(baseClasses, colorClass, ...additionalClasses);
};

/**
 * Get theme-aware classes for priority indicators
 */
export const getPriorityClasses = (priority: 'high' | 'medium' | 'low') => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  
  switch (priority) {
    case 'high':
      return cn(baseClasses, "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100");
    case 'medium':
      return cn(baseClasses, "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100");
    case 'low':
      return cn(baseClasses, "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100");
    default:
      return cn(baseClasses, "bg-secondary text-secondary-foreground");
  }
};

/**
 * Get theme-aware hover classes for interactive elements
 */
export const getHoverClasses = (...additionalClasses: ClassValue[]) => {
  return cn(
    "transition-colors duration-200",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:bg-accent focus:text-accent-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    ...additionalClasses
  );
};

/**
 * Get theme-aware border classes
 */
export const getBorderClasses = (variant: 'default' | 'muted' | 'accent' = 'default') => {
  switch (variant) {
    case 'muted':
      return "border border-muted";
    case 'accent':
      return "border border-accent";
    default:
      return "border border-border";
  }
};