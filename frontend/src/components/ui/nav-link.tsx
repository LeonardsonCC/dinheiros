import { NavLink as RouterNavLink, NavLinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CustomNavLinkProps extends NavLinkProps {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export function NavLink({ icon: Icon, children, className, ...props }: CustomNavLinkProps) {
  return (
    <RouterNavLink
      className={({ isActive }) => cn(
        "flex items-center px-4 py-2 text-sm font-medium rounded-md group transition-colors",
        isActive 
          ? 'bg-accent text-accent-foreground' 
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <Icon className={cn(
              "w-5 h-5 mr-3", 
              isActive ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
            )} />
          )}
          {children}
        </>
      )}
    </RouterNavLink>
  );
}