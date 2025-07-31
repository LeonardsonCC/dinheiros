import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function GlassButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: GlassButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return `
          glass-button text-gray-700 dark:text-gray-200
          hover:shadow-lg hover:shadow-primary-500/20
        `;
      case 'secondary':
        return `
          glass-button text-gray-700 dark:text-gray-200
          hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30
        `;
      default:
        return `
          bg-primary-600/90 text-white border border-primary-500/30
          backdrop-blur-sm shadow-lg shadow-primary-500/25
          hover:bg-primary-700/90 hover:shadow-xl hover:shadow-primary-500/30
        `;
    }
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