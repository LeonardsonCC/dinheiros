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
      return cn(baseClasses, "bg-success-100 text-success-900 border border-success-200");
    case 'warning':
      return cn(baseClasses, "bg-warning-100 text-warning-900 border border-warning-200");
    case 'error':
      return cn(baseClasses, "bg-destructive-100 text-destructive-900 border border-destructive-200");
    case 'info':
      return cn(baseClasses, "bg-info-100 text-info-900 border border-info-200");
    default:
      return cn(baseClasses, "bg-secondary text-secondary-foreground");
  }
};

/**
 * Get theme-aware classes for transaction amounts (positive/negative)
 */
export const getAmountClasses = (amount: number, ...additionalClasses: ClassValue[]) => {
  const baseClasses = "font-medium";
  const colorClass = amount >= 0 ? "text-success" : "text-destructive";
  
  return cn(baseClasses, colorClass, ...additionalClasses);
};

/**
 * Get theme-aware classes for priority indicators
 */
export const getPriorityClasses = (priority: 'high' | 'medium' | 'low') => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  
  switch (priority) {
    case 'high':
      return cn(baseClasses, "bg-destructive-100 text-destructive-900");
    case 'medium':
      return cn(baseClasses, "bg-warning-100 text-warning-900");
    case 'low':
      return cn(baseClasses, "bg-success-100 text-success-900");
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
      return "border border-border/50";
    case 'accent':
      return "border border-primary/20";
    default:
      return "border border-border";
  }
};

/**
 * Color theme configuration
 */
export const colorThemes = {
  blue: {
    name: 'Blue',
    preview: 'hsl(221.2, 83.2%, 53.3%)',
    description: 'Clean, professional appearance'
  },
  green: {
    name: 'Green',
    preview: 'hsl(142, 70%, 49%)',
    description: 'Natural, growth-oriented feeling'
  },
  purple: {
    name: 'Purple',
    preview: 'hsl(262, 83%, 58%)',
    description: 'Creative, modern appearance'
  },
  orange: {
    name: 'Orange',
    preview: 'hsl(24, 95%, 53%)',
    description: 'Energetic, warm feeling'
  },
  rose: {
    name: 'Rose',
    preview: 'hsl(330, 81%, 60%)',
    description: 'Elegant, sophisticated appearance'
  }
} as const;

export type ColorTheme = keyof typeof colorThemes;