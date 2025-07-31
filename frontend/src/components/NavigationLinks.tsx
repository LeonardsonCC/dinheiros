import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navigationItems } from '../config/navigation';

interface NavigationLinksProps {
  onNavClick?: () => void;
  variant?: 'desktop' | 'mobile';
}

/**
 * Shared navigation links component for consistent rendering across desktop and mobile layouts
 * @param onNavClick - Optional callback for navigation click events (useful for mobile to close drawer)
 * @param variant - Layout variant to apply appropriate styling classes
 */
export default function NavigationLinks({ onNavClick, variant = 'desktop' }: NavigationLinksProps) {
  const { t } = useTranslation();

  const getNavLinkClasses = (isActive: boolean) => {
    const baseClasses = 'flex items-center font-medium group transition-all duration-300';
    const variantClasses = variant === 'mobile' 
      ? 'px-4 py-3 text-sm rounded-xl'
      : 'px-4 py-2 text-sm rounded-lg';
    
    const stateClasses = isActive
      ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20'
      : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md';

    return `${baseClasses} ${variantClasses} ${stateClasses}`;
  };

  const getIconClasses = (isActive: boolean) => {
    const baseClasses = 'w-5 h-5 mr-3';
    const activeClasses = isActive 
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-gray-500 dark:text-gray-400';
    
    const hoverClasses = variant === 'desktop' && !isActive
      ? 'group-hover:text-gray-700 dark:group-hover:text-gray-200'
      : '';

    return `${baseClasses} ${activeClasses} ${hoverClasses}`;
  };

  return (
    <>
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavClick}
            className={({ isActive }) => getNavLinkClasses(isActive)}
          >
            {({ isActive }) => (
              <>
                <IconComponent className={getIconClasses(isActive)} />
                {t(item.labelKey)}
              </>
            )}
          </NavLink>
        );
      })}
    </>
  );
}