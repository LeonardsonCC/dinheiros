import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Loading from '../components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { formatDate } from '../lib/utils';

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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalBalance')}</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-500 rounded-md">
              <CurrencyDollarIcon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.totalBalance) : '$0.00'}
            </div>
            <CardDescription className="mt-2">
              <Link
                to="/accounts"
                className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              >
                {t('dashboard.viewAllAccounts')}
              </Link>
            </CardDescription>
          </CardContent>
        </Card>

        {/* Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.income')}</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-md">
              <ArrowUpIcon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary ? formatCurrency(summary.totalIncome) : '$0.00'}
            </div>
            <CardDescription className="mt-2">
              <Link
                to="/accounts/transactions?types=income"
                className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              >
                {t('dashboard.viewAllIncome')}
              </Link>
            </CardDescription>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.expenses')}</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 text-white bg-red-500 rounded-md">
              <ArrowDownIcon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
            </div>
            <CardDescription className="mt-2">
              <Link
                to="/accounts/transactions?types=expense"
                className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              >
                {t('dashboard.viewAllExpenses')}
              </Link>
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">{t('dashboard.recentTransactions')}</CardTitle>
            <Link
              to="/accounts/transactions"
              className="text-sm font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary?.recentTransactions?.length ? (
              summary.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {t('dashboard.noRecentTransactions')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
