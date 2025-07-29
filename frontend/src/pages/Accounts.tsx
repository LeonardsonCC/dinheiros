import { useTranslation } from 'react-i18next';
import { BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';

const Accounts = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('accounts.title') || 'Accounts'}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your bank accounts and financial institutions.
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Account
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            No accounts yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get started by adding your first account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Accounts;