import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HomeIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, CurrencyDollarIcon, UserCircleIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import CategoryIcon from './CategoryIcon';
import ThemeToggle from './ThemeToggle';
import { Button, NavLink } from '@/components/ui';

const Layout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center justify-between flex-shrink-0 px-4">
        <h1 className="text-2xl font-bold text-primary">Dinheiros</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileMenu}
              className="p-2"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
      <LanguageSwitcher />
      <nav className="flex-1 mt-5 space-y-1 px-2">
        <NavLink to="/" icon={HomeIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.dashboard')}
        </NavLink>
        <NavLink to="/accounts" end icon={BanknotesIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.accounts')}
        </NavLink>
        <NavLink to="/accounts/transactions" end icon={CurrencyDollarIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.allTransactions')}
        </NavLink>
        <NavLink to="/accounts/transactions/import" icon={DocumentTextIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.importTransactions')}
        </NavLink>
        <NavLink to="/statistics" icon={ChartBarIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.statistics')}
        </NavLink>
        <NavLink to="/categories" icon={CategoryIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.categories')}
        </NavLink>
        <NavLink to="/categorization-rules" icon={Cog6ToothIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.categorizationRules')}
        </NavLink>
        <NavLink to="/profile" icon={UserCircleIcon} onClick={isMobile ? closeMobileMenu : undefined}>
          {t('sidebar.profile')}
        </NavLink>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="justify-start w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-accent-foreground"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
          {t('sidebar.logout')}
        </Button>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-card border-r border-border">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={closeMobileMenu} 
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border shadow-xl transform transition-transform">
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2"
            >
              <Bars3Icon className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-primary">Dinheiros</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
