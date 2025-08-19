import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusIcon, ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import TransactionsTable, { Transaction as TableTransaction } from '../components/TransactionsTable';
import Loading from '../components/Loading';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/utils';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui';

export default function Transactions() {
  const { t } = useTranslation();
  const { accountId: accountIdParam } = useParams<{ accountId: string }>();
  // Ensure accountId is a number
  const accountId = accountIdParam ? Number(accountIdParam) : null;

  // Use TableTransaction type everywhere instead of local Transaction
  const [transactions, setTransactions] = useState<TableTransaction[]>([]);
  const [account, setAccount] = useState<{ name: string; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pagination and sorting state for TransactionsTable
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: transactions.length,
    totalPages: Math.max(1, Math.ceil(transactions.length / 10)),
  });
  // Fix sortConfig typing for TransactionsTable
  type TransactionTableKey = 'date' | 'description' | 'amount';
  const [sortConfig, setSortConfig] = useState<{ key: TransactionTableKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId) {
        console.error('No account ID provided');
        toast.error('No account ID provided');
        return;
      }

      try {
        setLoading(true);

        if (isNaN(accountId as number)) {
          throw new Error('Invalid account ID format');
        }

        try {
          // First, fetch account details to verify the account exists
          const accountUrl = `/api/accounts/${accountId}`;
          const accountRes = await api.get(accountUrl);
          setAccount(accountRes.data);

          // Then fetch transactions
          const transactionsUrl = `/api/accounts/${accountId}/transactions`;
          const transactionsRes = await api.get(transactionsUrl);

          if (transactionsRes.data) {
            setTransactions(transactionsRes.data);
          } else {
            console.warn('Unexpected transactions response format');
            setTransactions([]);
          }
        } catch (err: unknown) {
          console.error('Error in fetch sequence');
          throw err; // Re-throw to be caught by the outer catch block
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to load data';
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const error = err as AxiosError;
          const data = error.response?.data;
          if (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string') {
            errorMessage = (data as { message: string }).message;
          }
        }
        console.error('Error fetching data:', err);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId]);

  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems: transactions.length,
      totalPages: Math.max(1, Math.ceil(transactions.length / prev.pageSize)),
      currentPage: Math.min(prev.currentPage, Math.max(1, Math.ceil(transactions.length / prev.pageSize)))
    }));
  }, [transactions]);

  if (loading) {
    return <Loading message={t('importTransactions.loading')} />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    if (!accountId) {
      toast.error('No account selected');
      return;
    }

    try {
      setDeletingId(transactionId);
      await api.delete(`/api/accounts/${accountId}/transactions/${transactionId}`);

      // Update the transactions list by removing the deleted transaction
      setTransactions(transactions.filter(tx => tx.id !== transactionId));

      // Update the account balance
      if (account) {
        const deletedTransaction = transactions.find(tx => tx.id === transactionId);
        if (deletedTransaction) {
          const amount = deletedTransaction.amount;
          const newBalance = account.balance +
            (deletedTransaction.type === 'expense' ? amount : -amount);
          setAccount({ ...account, balance: newBalance });
        }
      }

      toast.success('Transaction deleted successfully');
    } catch (err: unknown) {
      let errorMessage = 'Failed to delete transaction';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const error = err as AxiosError;
        const data = error.response?.data;
        if (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string') {
          errorMessage = (data as { message: string }).message;
        }
      }
      console.error('Error deleting transaction:', err);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), currentPage: 1 }));
  };
  // Accept all keys but only handle allowed ones
  const handleSort = (key: keyof TableTransaction) => {
    if (key === 'date' || key === 'description' || key === 'amount') {
      setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    }
  };
  const getSortIndicator = (key: keyof TableTransaction) => {
    if (key !== sortConfig.key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Adapt transactions for TransactionsTable (add dummy account field)
  const paginatedSortedTransactions = [...transactions]
    .sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;
      if (sortConfig.key === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortConfig.key === 'description') {
        aValue = a.description || '';
        bValue = b.description || '';
      } else if (sortConfig.key === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      }
      if (aValue! < bValue!) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    })
    .slice((pagination.currentPage - 1) * pagination.pageSize, pagination.currentPage * pagination.pageSize)
    .map(tx => ({
      ...tx,
      account: { id: accountId || 0, name: account?.name || 'Account' },
      // Fix: use toAccount if present, otherwise undefined
      toAccount: tx.toAccount ? { id: tx.toAccount.id, name: tx.toAccount.name ?? '' } : undefined,
    }));

  // Use TransactionsTable for displaying transactions
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
          {t('transactions.backToAccounts')}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {account?.name} {t('transactions.transactions')}
          </h2>
          <Button asChild>
            <Link
              to={`/accounts/${accountId}/transactions/new`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
              {t('transactions.add')}
            </Link>
          </Button>
        </div>
        <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(account?.balance || 0)}
        </div>
      </div>
      <TransactionsTable
        transactions={paginatedSortedTransactions}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        getSortIndicator={getSortIndicator}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        renderActions={(transaction) => (
          <div className="flex items-center space-x-3 justify-center">
            <Link
              to={`/accounts/${accountId}/transactions/${transaction.id}/edit`}
              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
            >
              {t('transactions.edit')}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              type="button"
              onClick={() => handleDeleteTransaction(transaction.id)}
              disabled={deletingId === transaction.id}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 text-sm"
            >
              {deletingId === transaction.id ? t('transactions.deleting') : t('transactions.delete')}
            </button>
          </div>
        )}
      />
    </div>
  );
}
