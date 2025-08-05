import { Outlet, useNavigate } from 'react-router-dom';
import { HomeIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, CurrencyDollarIcon, UserCircleIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import CategoryIcon from './CategoryIcon';
import ThemeToggle from './ThemeToggle';
import { Button, NavLink } from '@/components/ui';

const Layout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-card border-r border-border">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-primary">Dinheiros</h1>
              <ThemeToggle />
            </div>
            <LanguageSwitcher />
            <nav className="flex-1 mt-5 space-y-1 px-2">
              <NavLink to="/" icon={HomeIcon}>
                {t('sidebar.dashboard')}
              </NavLink>
              <NavLink to="/accounts" end icon={BanknotesIcon}>
                {t('sidebar.accounts')}
              </NavLink>
              <NavLink to="/accounts/transactions" end icon={CurrencyDollarIcon}>
                {t('sidebar.allTransactions')}
              </NavLink>
              <NavLink to="/accounts/transactions/import" icon={DocumentTextIcon}>
                {t('sidebar.importTransactions')}
              </NavLink>
              <NavLink to="/statistics" icon={ChartBarIcon}>
                {t('sidebar.statistics')}
              </NavLink>
              <NavLink to="/categories" icon={CategoryIcon}>
                {t('sidebar.categories')}
              </NavLink>
              <NavLink to="/categorization-rules" icon={Cog6ToothIcon}>
                {t('sidebar.categorizationRules')}
              </NavLink>
              <NavLink to="/profile" icon={UserCircleIcon}>
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
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
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
