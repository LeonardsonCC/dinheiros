import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/dashboard/profile');
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleProfile}
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-left text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
      >
        <UserCircleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        {t('sidebar.profile')}
      </button>
      
      <button
        onClick={handleLogout}
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-left text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
      >
        <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        {t('sidebar.logout')}
      </button>
    </div>
  );
};

export default UserMenu;