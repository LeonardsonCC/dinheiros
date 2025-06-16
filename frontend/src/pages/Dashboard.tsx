import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

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
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance */}
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white bg-blue-500 rounded-md">
                <CurrencyDollarIcon className="w-6 h-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary ? formatCurrency(summary.totalBalance) : '$0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-50">
            <div className="text-sm">
              <Link
                to="/accounts"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all accounts
              </Link>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white bg-green-500 rounded-md">
                <ArrowUpIcon className="w-6 h-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Income</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary ? formatCurrency(summary.totalIncome) : '$0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-50">
            <div className="text-sm">
              <Link
                to="/transactions?type=income"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all income
              </Link>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white bg-red-500 rounded-md">
                <ArrowDownIcon className="w-6 h-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expenses</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-50">
            <div className="text-sm">
              <Link
                to="/transactions?type=expense"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all expenses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          <Link
            to="/transactions"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {summary?.recentTransactions?.length ? (
              summary.recentTransactions.map((transaction) => (
                <li key={transaction.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {transaction.description}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <p className="flex items-center text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-12 text-center text-gray-500">
                No recent transactions. Add your first transaction to get started.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
