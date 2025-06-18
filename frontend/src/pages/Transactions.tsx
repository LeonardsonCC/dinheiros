import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusIcon, ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  date: string;
  categories: Category[];
  toAccountId?: number;
}

export default function Transactions() {
  const { accountId: accountIdParam } = useParams<{ accountId: string }>();
  // Ensure accountId is a number
  const accountId = accountIdParam ? Number(accountIdParam) : null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [account, setAccount] = useState<{ name: string; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        } catch (err: any) {
          console.error('Error in fetch sequence');
          throw err; // Re-throw to be caught by the outer catch block
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        
        // More specific error messages based on the error
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          
          if (err.response.status === 404) {
            toast.error('Account not found');
          } else if (err.response.status === 400) {
            toast.error('Invalid account ID format');
          } else {
            toast.error(`Error: ${err.response.data?.message || 'Failed to load data'}`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received:', err.request);
          toast.error('No response from server');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', err.message);
          toast.error(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId]);

  if (loading) {
    return <div className="p-8 text-center">Loading transactions...</div>;
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
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
          Back to Accounts
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {account?.name} Transactions
          </h2>
          <Link
            to={`/accounts/${accountId}/transactions/new`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
            Add Transaction
          </Link>
        </div>
        <div className="mt-2 text-xl font-semibold text-gray-900">
          {formatCurrency(account?.balance || 0)}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {Array.isArray(transactions) && transactions.length > 0 ? (
            transactions.map((transaction) => (
              <li key={transaction.id} className="border-b border-gray-200">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.description}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.type === 'expense' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        {transaction.categories && transaction.categories.length > 0 && (
                          <>
                            <span className="text-xs text-gray-500">•</span>
                            <div className="flex flex-wrap gap-1">
                              {transaction.categories.map(category => (
                                <span 
                                  key={category.id} 
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {category.name}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'income' 
                          ? 'text-green-600' 
                          : transaction.type === 'expense' 
                            ? 'text-red-600'
                            : 'text-blue-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <div className="mt-2 flex items-center space-x-3">
                        <Link
                          to={`/accounts/${accountId}/transactions/${transaction.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 text-sm"
                        >
                          Edit
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          disabled={deletingId === transaction.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 text-sm"
                        >
                          {deletingId === transaction.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center text-gray-500">
              No transactions found. Add your first transaction to get started.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
