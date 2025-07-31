import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, CurrencyDollarIcon, UserCircleIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import CategoryIcon from './CategoryIcon';
import ThemeToggle from './ThemeToggle';
import MobileNav from './MobileNav';

const Layout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-card m-2 rounded-2xl animate-fade-in">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="glass-button rounded-xl p-2 text-gray-600 dark:text-gray-300"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Dinheiros</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 glass-card border-r border-white/30 dark:border-white/10 m-2 mr-0 rounded-r-none">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Dinheiros</h1>
              <ThemeToggle />
            </div>
            <LanguageSwitcher />
            <nav className="flex-1 mt-5 space-y-1 px-2">
              <NavLink
                to="/"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <HomeIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.dashboard')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/accounts"
                end
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <BanknotesIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.accounts')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/accounts/transactions"
                end
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <CurrencyDollarIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.allTransactions')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/accounts/transactions/import"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <DocumentTextIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.importTransactions')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/statistics"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <ChartBarIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.statistics')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/categories"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <CategoryIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.categories')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/categorization-rules"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <Cog6ToothIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.categorizationRules')}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-lg group transition-all duration-300
                  ${isActive 
                    ? 'glass-button text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:glass-button hover:shadow-md'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <UserCircleIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    {t('sidebar.profile')}
                  </>
                )}
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-left text-gray-700 dark:text-gray-200 rounded-lg hover:glass-button hover:shadow-md group transition-all duration-300"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                {t('sidebar.logout')}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6 pt-20 md:pt-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              <div className="animate-fade-in">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
