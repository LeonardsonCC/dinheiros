import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SimpleTransactionsTable from '../components/SimpleTransactionsTable';
import CategoryIcon from '../components/CategoryIcon';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  account: Account;
  categories: Array<{ id: string; name: string; type: string }>;
}

interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  accountsCount: number;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    accountsCount: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch accounts
        const accountsResponse = await api.get('/api/accounts');
        const accountsData = accountsResponse.data;

        // Calculate stats
        const totalBalance = accountsData.reduce((sum: number, account: Account) => sum + account.balance, 0);
        
        // Fetch recent transactions
        const transactionsResponse = await api.get('/api/transactions?limit=10');
        const transactionsData = transactionsResponse.data.transactions || [];
        setRecentTransactions(transactionsData);

        // Calculate income and expenses from recent transactions
        const totalIncome = transactionsData
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        
        const totalExpenses = transactionsData
          .filter((t: Transaction) => t.type === 'expense')
          .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

        setStats({
          totalBalance,
          totalIncome,
          totalExpenses,
          accountsCount: accountsData.length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    link?: string;
  }> = ({ title, value, icon: Icon, color, link }) => {
    const content = (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 ${link ? 'cursor-pointer' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' : 
            color.includes('red') ? 'bg-red-100 dark:bg-red-900/30' : 
            'bg-primary-100 dark:bg-primary-900/30'}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Here's an overview of your finances.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/dashboard/transactions/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Transaction
          </Link>
          <Link
            to="/dashboard/accounts/new"
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Account
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.totalBalance')}
          value={stats.totalBalance}
          icon={BanknotesIcon}
          color="text-primary-600 dark:text-primary-400"
          link="/dashboard/accounts"
        />
        <StatCard
          title={t('dashboard.income')}
          value={stats.totalIncome}
          icon={ArrowTrendingUpIcon}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title={t('dashboard.expenses')}
          value={stats.totalExpenses}
          icon={ArrowTrendingDownIcon}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Accounts"
          value={stats.accountsCount}
          icon={BanknotesIcon}
          color="text-blue-600 dark:text-blue-400"
          link="/dashboard/accounts"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentTransactions')}
            </h2>
            <Link
              to="/dashboard/transactions"
              className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              {t('dashboard.viewAll')}
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentTransactions.length > 0 ? (
            <SimpleTransactionsTable transactions={recentTransactions} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {t('dashboard.noRecentTransactions')}
              </p>
              <Link
                to="/dashboard/transactions/new"
                className="mt-2 inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add your first transaction
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/dashboard/transactions/import"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                Import Transactions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload PDF statements
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/statistics"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                View Statistics
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Analyze your spending
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/categories"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CategoryIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                Manage Categories
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Organize your transactions
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;