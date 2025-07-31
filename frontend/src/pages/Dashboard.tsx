import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Loading from '../components/Loading';
import GlassCard from '../components/GlassCard';

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

  return (
    <div className="p-4 xs:p-6 space-y-4 xs:space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 animate-slide-up">{t('dashboard.title')}</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 xs:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance */}
        <GlassCard variant="elevated" animation="scale-in">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <CurrencyDollarIcon className="w-7 h-7" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{t('dashboard.totalBalance')}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {summary ? formatCurrency(summary.totalBalance) : '$0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 glass border-t border-white/20 dark:border-white/10">
            <div className="text-sm">
              <Link
                to="/accounts"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                {t('dashboard.viewAllAccounts')}
              </Link>
            </div>
          </div>
        </GlassCard>

        {/* Income */}
        <GlassCard variant="elevated" animation="scale-in">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 text-white bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <ArrowUpIcon className="w-7 h-7" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{t('dashboard.income')}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {summary ? formatCurrency(summary.totalIncome) : '$0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 glass border-t border-white/20 dark:border-white/10">
            <div className="text-sm">
              <Link
                to="/accounts/transactions?types=income"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                {t('dashboard.viewAllIncome')}
              </Link>
            </div>
          </div>
        </GlassCard>

        {/* Expenses */}
        <GlassCard variant="elevated" animation="scale-in">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 text-white bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <ArrowDownIcon className="w-7 h-7" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{t('dashboard.expenses')}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 glass border-t border-white/20 dark:border-white/10">
            <div className="text-sm">
              <Link
                to="/accounts/transactions?types=expense"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                {t('dashboard.viewAllExpenses')}
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.recentTransactions')}</h2>
          <Link
            to="/accounts/transactions"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <GlassCard variant="default" animation="slide-up">
          <ul className="divide-y divide-white/10 dark:divide-white/10">
            {summary?.recentTransactions?.length ? (
              summary.recentTransactions.map((transaction) => (
                <li key={transaction.id} className="hover:glass-button transition-all duration-300">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {transaction.description}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <p className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                {t('dashboard.noRecentTransactions')}
              </li>
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
