import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  ShareIcon, 
  UserGroupIcon,
  EyeIcon,
  CurrencyDollarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';
import ShareAccountModal from '../components/ShareAccountModal';
import { useTranslation } from 'react-i18next';

interface Account {
  id: number | string;
  _id?: string;
  ID?: string | number;
  name: string;
  accountName?: string;
  balance: number;
  currentBalance?: number;
  color?: string;
}

interface ProcessedAccount {
  id: number | string;
  name: string;
  balance: number;
  color: string;
}

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function Accounts() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<ProcessedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/api/accounts');

        let accountsData: Account[] = [];
        
        if (response.data) {
          if (Array.isArray(response.data.accounts)) {
            accountsData = response.data.accounts;
          } else if (Array.isArray(response.data.data)) {
            accountsData = response.data.data;
          } else if (Array.isArray(response.data)) {
            accountsData = response.data;
          } else if (response.data.id || response.data._id || response.data.ID) {
            accountsData = [response.data];
          }
        }
        
        const processedAccounts: ProcessedAccount[] = accountsData.map(account => {
          const accountId = account.id || account._id || account.ID;
          if (!accountId) return null;

          return {
            id: accountId,
            name: account.name || account.accountName || 'Unnamed Account',
            balance: account.balance || account.currentBalance || 0,
            color: account.color || '#3b82f6',
          };
        }).filter((account): account is ProcessedAccount => account !== null);
        
        setAccounts(processedAccounts);
      } catch (error: unknown) {
        let errorMessage = 'Failed to load accounts';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as AxiosError;
          if (typeof err.response?.data?.message === 'string') {
            errorMessage = err.response.data.message;
          }
        }
        console.error('Error fetching accounts:', error);
        toast.error(errorMessage);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleDelete = async (accountId: string | number) => {
    if (!window.confirm(t('accounts.confirmDelete') || 'Are you sure you want to delete this account?'))
      return;

    try {
      setDeletingId(accountId);
      await api.delete(`/api/accounts/${accountId}`);
      
      setAccounts(accounts.filter(account => account.id !== accountId));
      toast.success(t('accounts.deleted') || 'Account deleted successfully');
    } catch (error: unknown) {
      let errorMessage = t('accounts.failedDelete') || 'Failed to delete account';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Error deleting account:', error);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareAccount = (account: ProcessedAccount) => {
    setSelectedAccount({ id: String(account.id), name: account.name });
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <Loading message={t('accounts.loading') || 'Loading accounts...'} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('accounts.title') || 'Accounts'}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your financial accounts and track balances
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/dashboard/shared-accounts"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            {t('sharing.sharedWithMe') || 'Shared with me'}
          </Link>
          <Link
            to="/dashboard/accounts/new"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('accounts.addAccount') || 'Add Account'}
          </Link>
        </div>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <BanknotesIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No accounts yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t('accounts.noAccounts') || 'Get started by creating your first account'}
          </p>
          <Link
            to="/dashboard/accounts/new"
            className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create your first account
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div 
              key={account.id} 
              className="group relative bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleShareAccount(account);
                  }}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                  title="Share account"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>
                <Link
                  to={`/dashboard/accounts/${account.id}/edit`}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                  title="Edit account"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDelete(account.id);
                  }}
                  disabled={deletingId === account.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Delete account"
                >
                  {deletingId === account.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Account content */}
              <Link to={`/dashboard/accounts/${account.id}/transactions`} className="block">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: account.color }}
                  >
                    <BanknotesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                      {account.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Account Balance
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                    View transactions
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    <EyeIcon className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Share Account Modal */}
      {selectedAccount && (
        <ShareAccountModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          accountId={selectedAccount.id}
          accountName={selectedAccount.name}
        />
      )}
    </div>
  );
}