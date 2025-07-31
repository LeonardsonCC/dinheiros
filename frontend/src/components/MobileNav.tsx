import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavigationLinks from './NavigationLinks';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    onClose();
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="glass-card m-2 rounded-2xl flex flex-col">
                <div className="flex items-center justify-between p-4">
                  <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Dinheiros</h1>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                      type="button"
                      className="glass-button rounded-xl p-2 text-gray-600 dark:text-gray-300"
                      onClick={onClose}
                      aria-label="Close navigation menu"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-2">
                  <LanguageSwitcher />
                </div>

                <nav className="flex-1 space-y-2 px-4 pb-4">
                  <NavigationLinks onNavClick={handleNavClick} variant="mobile" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-200 rounded-xl hover:glass-button hover:shadow-md group transition-all duration-300"
                    aria-label={t('sidebar.logout')}
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    {t('sidebar.logout')}
                  </button>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}