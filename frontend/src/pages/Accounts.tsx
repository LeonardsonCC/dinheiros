import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon, ShareIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';
import ShareAccountModal from '../components/ShareAccountModal';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

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

// Internal type for the processed account data
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

        
        // Handle different possible response formats
        let accountsData: Account[] = [];
        
        if (response.data) {
          // Case 1: Response has an 'accounts' array
          if (Array.isArray(response.data.accounts)) {
            accountsData = response.data.accounts;
          } 
          // Case 2: Response has a 'data' array
          else if (Array.isArray(response.data.data)) {
            accountsData = response.data.data;
          }
          // Case 3: Response is an array
          else if (Array.isArray(response.data)) {
            accountsData = response.data;
          }
          // Case 4: Response is a single account object
          else if (response.data.id || response.data._id || response.data.ID) {
            accountsData = [response.data];
          }
        }
        
        // Process the accounts data to ensure consistent structure
        const processedAccounts: ProcessedAccount[] = accountsData.map(account => {
          // Handle different ID field names
          const accountId = account.id || account._id || account.ID;
          if (!accountId) return null;

          return {
            id: accountId,
            name: account.name || account.accountName || 'Unnamed Account',
            balance: account.balance || account.currentBalance || 0,
            color: account.color || '#cccccc',
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
    if (!window.confirm(t('accounts.confirmDelete')))
      return;

    try {
      setDeletingId(accountId);
      await api.delete(`/api/accounts/${accountId}`);
      
      // Remove the deleted account from the state
      setAccounts(accounts.filter(account => account.id !== accountId));
      toast.success(t('accounts.deleted'));
    } catch (error: unknown) {
      let errorMessage = t('accounts.failedDelete');
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

  if (loading) {
    return <Loading message={t('accounts.loading')} />;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 animate-slide-up">{t('accounts.title')}</h2>
        <div className="flex gap-3">
          <GlassButton
            as={Link}
            to="/shared-accounts"
            variant="secondary"
            size="md"
            className="inline-flex items-center"
          >
            <UserGroupIcon className="w-5 h-5 mr-2 -ml-1" />
            {t('sharing.sharedWithMe')}
          </GlassButton>
          <GlassButton
            as={Link}
            to="/accounts/new"
            variant="primary"
            size="md"
            className="inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
            {t('accounts.addAccount')}
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <GlassCard className="col-span-full" variant="subtle" animation="fade-in">
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('accounts.noAccounts')}</div>
          </GlassCard>
        ) : (
          accounts.map((account, index) => (
            <GlassCard 
              key={account.id} 
              className="relative group cursor-pointer" 
              variant="default" 
              animation="slide-up"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleShareAccount(account);
                  }}
                  className="p-2 glass-button text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400 transition-colors duration-200 rounded-lg"
                  title={t('sharing.shareAccount')}
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
                <Link
                  to={`/accounts/${account.id}/edit`}
                  className="p-2 glass-button text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg"
                  title={t('accounts.editAccount')}
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDelete(account.id);
                  }}
                  disabled={deletingId === account.id}
                  className="p-2 glass-button text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200 disabled:opacity-50 rounded-lg"
                  title={t('accounts.deleteAccount')}
                >
                  {deletingId === account.id ? (
                    <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Link to={`/accounts/${account.id}/transactions`} className="block p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-block w-5 h-5 rounded-full border-2 border-white/20 shadow-lg"
                    style={{ backgroundColor: account.color || '#cccccc' }}
                    title={account.color || '#cccccc'}
                  ></span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{account.name}</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(account.balance || 0)}
                </p>
                <div className="flex items-center text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">
                  <span>{t('accounts.viewTransactions')}</span>
                  <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </GlassCard>
          ))
        )}
      </div>

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
