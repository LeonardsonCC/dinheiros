import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, CurrencyDollarIcon, UserCircleIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import CategoryIcon from './CategoryIcon';
import ThemeToggle from './ThemeToggle';

const Layout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Dinheiros</h1>
              <ThemeToggle />
            </div>
            <LanguageSwitcher />
            <nav className="flex-1 mt-5 space-y-1 bg-white dark:bg-gray-800 px-2">
              <NavLink
                to="/"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-left text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 group"
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
