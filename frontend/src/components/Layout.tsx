import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, CurrencyDollarIcon, UserCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-primary-600">Dinheiros</h1>
            </div>
            <nav className="flex-1 mt-5 space-y-1 bg-white px-2">
              <NavLink
                to="/"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <HomeIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    Dashboard
                  </>
                )}
              </NavLink>
              <NavLink
                to="/accounts"
                end
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <BanknotesIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    Accounts
                  </>
                )}
              </NavLink>
              <NavLink
                to="/accounts/transactions"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <CurrencyDollarIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    All Transactions
                  </>
                )}
              </NavLink>
              <NavLink
                to="/accounts/transactions/import"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <DocumentTextIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    Import Transactions
                  </>
                )}
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <UserCircleIcon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    Profile
                  </>
                )}
              </NavLink>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-left text-gray-700 rounded-md hover:bg-gray-100 group"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                Logout
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
