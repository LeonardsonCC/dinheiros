import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: number;
  name: string;
  description: string;
  type: TransactionType;
}

interface CategoryManagerProps {
  initialType?: TransactionType;
  onCategoryAdded: (category: Category) => void;
  buttonVariant?: 'default' | 'icon'; // add this prop
  buttonClassName?: string; // allow custom class
}

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function CategoryManager({ initialType = 'expense', onCategoryAdded, buttonVariant = 'default', buttonClassName }: CategoryManagerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent forms
    
    if (!name.trim()) {
      toast.error(t('categoryManager.nameRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/categories', {
        name: name.trim(),
        description: description.trim(),
        type: type
      });
      
      onCategoryAdded(response.data);
      toast.success(t('categoryManager.added'));
      closeModal();
    } catch (error: unknown) {
      let errorMessage = t('categoryManager.failed');
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Error creating category:', error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setType(initialType)
    setIsOpen(true)
  };
  const closeModal = () => {
    setIsOpen(false);
    setName('');
    setDescription('');
    setType('expense');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        {buttonVariant === 'icon' ? (
          <button
            type="button"
            onClick={openModal}
            className={`p-1 rounded-full bg-primary-100 dark:bg-primary-900/50 hover:bg-primary-200 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-200 ${buttonClassName || ''}`}
            title={t('categoryManager.addCategory')}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        ) : (
          <>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('categoryManager.categories')}
            </span>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 dark:text-primary-200 bg-primary-100 dark:bg-primary-900/50 hover:bg-primary-200 dark:hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-3.5 w-3.5 mr-1" />
              {t('categoryManager.addCategory')}
            </button>
          </>
        )}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {t('categoryManager.addNew')}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('categoryManager.name')} *
                        </label>
                        <input
                          type="text"
                          id="category-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                          placeholder={t('categoryManager.namePlaceholder')}
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('categoryManager.description')}
                        </label>
                        <textarea
                          id="category-description"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                          placeholder={t('categoryManager.descriptionPlaceholder')}
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="category-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('categoryManager.type')} *
                        </label>
                        <select
                          id="category-type"
                          value={type}
                          onChange={(e) => setType(e.target.value as TransactionType)}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                          <option value="expense">{t('dashboard.expenses')}</option>
                          <option value="income">{t('dashboard.income')}</option>
                          <option value="transfer">{t('categoryManager.transfer')}</option>
                        </select>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
                        >
                          {isSubmitting ? t('categoryManager.adding') : t('categoryManager.addCategory')}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          onClick={closeModal}
                        >
                          {t('categoryManager.cancel')}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
