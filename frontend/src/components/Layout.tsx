import { Outlet, Link, useNavigate } from 'react-router-dom';
import { HomeIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

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
              <Link
                to="/"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 group"
              >
                <HomeIcon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                Dashboard
              </Link>
              <Link
                to="/accounts"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 group"
              >
                <BanknotesIcon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                Accounts
              </Link>
              <Link
                to="/accounts/transactions"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 group"
              >
                <CurrencyDollarIcon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                All Transactions
              </Link>
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
