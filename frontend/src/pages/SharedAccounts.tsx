import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';
import SharedAccountBadge from '../components/SharedAccountBadge';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/utils';

interface SharedAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
  color: string;
  owner_name: string;
  owner_email: string;
  permission_level: string;
  shared_at: string;
  is_shared: boolean;
}

export default function SharedAccounts() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<SharedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedAccounts();
  }, []);

  const fetchSharedAccounts = async () => {
    try {
      const response = await fetch('/api/shares/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data || []);
      } else {
        const error = await response.json();
        toast.error(error.error || t('sharing.failedToLoadSharedAccounts'));
      }
    } catch (error) {
      console.error('Error fetching shared accounts:', error);
      toast.error(t('sharing.failedToLoadSharedAccounts'));
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <Loading message={t('sharing.loadingSharedAccounts')} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <UserGroupIcon className="h-8 w-8 mr-3 text-primary-600" />
            {t('sharing.sharedWithMe')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('sharing.sharedAccountsDescription')}
          </p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('sharing.noSharedAccounts')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('sharing.noSharedAccountsMessage')}
          </p>
          <div className="mt-6">
            <Link
              to="/accounts"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('sharing.viewMyAccounts')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200 border-l-4 border-blue-500"
            >
              <Link to={`/accounts/${account.id}/transactions`}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: account.color || '#cccccc' }}
                    title={account.color || '#cccccc'}
                  ></span>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {account.name}
                  </h3>
                </div>

                <SharedAccountBadge
                  isShared={true}
                  ownerName={account.owner_name}
                  ownerEmail={account.owner_email}
                  className="mb-3"
                />

                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(account.balance || 0)}
                </p>

                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">{t('sharing.accountType')}:</span>{' '}
                    {t(`accounts.types.${account.type}`, account.type)}
                  </p>
                  <p>
                    <span className="font-medium">{t('sharing.sharedOn')}:</span>{' '}
                    {formatDate(account.shared_at)}
                  </p>
                  <p>
                    <span className="font-medium">{t('sharing.permission')}:</span>{' '}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {t(`sharing.permissions.${account.permission_level}`, account.permission_level)}
                    </span>
                  </p>
                </div>

                <div className="mt-4 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                  {t('accounts.viewTransactions')} &rarr;
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/accounts"
          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
        >
          ← {t('sharing.backToMyAccounts')}
        </Link>
      </div>
    </div>
  );
}