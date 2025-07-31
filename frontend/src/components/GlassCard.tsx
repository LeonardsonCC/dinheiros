import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  animation?: 'fade-in' | 'slide-up' | 'scale-in' | 'none';
}

export default function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  animation = 'fade-in'
}: GlassCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'backdrop-blur-xl bg-white/40 dark:bg-black/30 border border-white/40 dark:border-white/20 shadow-2xl shadow-black/10 dark:shadow-black/30';
      case 'subtle':
        return 'backdrop-blur-sm bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20';
      default:
        return 'glass-card';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'slide-up':
        return 'animate-slide-up';
      case 'scale-in':
        return 'animate-scale-in';
      case 'none':
        return '';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div 
      className={`
        overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
        ${getVariantClasses()}
        ${getAnimationClasses()}
        ${className}
      `}
    >
      {children}
    </div>
  );
}