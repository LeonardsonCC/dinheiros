import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Loading from '../components/Loading';

interface Summary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  recentTransactions: Array<{
    id: number;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    date: string;
    account_name?: string;
  }>;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/api/summary');
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'expense':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />;
      default:
        return <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t('dashboard.title')}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <Link
          to="/dashboard/accounts/transactions/new"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <CurrencyDollarIcon className="w-4 h-4 mr-2" />
          Add Transaction
        </Link>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('dashboard.totalBalance')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {summary ? formatCurrency(summary.totalBalance) : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                to="/dashboard/accounts"
                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                {t('dashboard.viewAllAccounts')}
              </Link>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <ArrowUpIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('dashboard.income')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {summary ? formatCurrency(summary.totalIncome) : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                to="/dashboard/accounts/transactions?types=income"
                className="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                {t('dashboard.viewAllIncome')}
              </Link>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                  <ArrowDownIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('dashboard.expenses')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                to="/dashboard/accounts/transactions?types=expense"
                className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                {t('dashboard.viewAllExpenses')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {t('dashboard.recentTransactions')}
            </h2>
            <Link
              to="/dashboard/accounts/transactions"
              className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {t('dashboard.viewAll')}
              <ArrowUpIcon className="w-4 h-4 ml-1 rotate-45" />
            </Link>
          </div>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {summary?.recentTransactions?.length ? (
            summary.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {transaction.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        {transaction.account_name && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {transaction.account_name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : transaction.type === 'expense'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                      {transaction.type}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <CurrencyDollarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {t('dashboard.noRecentTransactions')}
              </p>
              <Link
                to="/dashboard/accounts/transactions/new"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add your first transaction
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}