import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant: 'primary' for solid colored, 'secondary'/'glass' for glass morphism effects */
  variant?: 'primary' | 'secondary' | 'glass';
  /** Button size: 'sm' (small), 'md' (medium), 'lg' (large) */
  size?: 'sm' | 'md' | 'lg';
  /** React nodes to render inside the button */
  children: React.ReactNode;
}

/**
 * A reusable button component with glassmorphism styling effects
 * @param variant - Visual style variant: 'primary' (solid), 'secondary'/'glass' (glass effects)
 * @param size - Button size: 'sm', 'md', 'lg'
 * @param className - Additional CSS classes to apply
 * @param children - React nodes to render inside the button
 * @param props - All other HTML button attributes
 */
export default function GlassButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: GlassButtonProps) {
  const VARIANT_CLASSES = {
    glass: 'glass-button text-gray-700 dark:text-gray-200 hover:shadow-lg hover:shadow-primary-500/20',
    secondary: 'glass-button text-gray-700 dark:text-gray-200 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30',
    primary: 'bg-primary-600/90 text-white border border-primary-500/30 backdrop-blur-sm shadow-lg shadow-primary-500/25 hover:bg-primary-700/90 hover:shadow-xl hover:shadow-primary-500/30'
  } as const;

  const getVariantClasses = () => {
    return VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        transition-all duration-300 animate-scale-in
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}