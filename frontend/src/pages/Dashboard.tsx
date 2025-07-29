import { useTranslation } from 'react-i18next';
import { 
  BanknotesIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    {
      name: 'Total Balance',
      value: '$12,345.67',
      change: '+2.5%',
      changeType: 'positive',
      icon: BanknotesIcon,
    },
    {
      name: 'Monthly Income',
      value: '$5,432.10',
      change: '+12.3%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Monthly Expenses',
      value: '$3,210.45',
      change: '-5.2%',
      changeType: 'negative',
      icon: ArrowTrendingDownIcon,
    },
    {
      name: 'Transactions',
      value: '156',
      change: '+8.1%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('dashboard.title') || 'Dashboard'}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Welcome back! Here's an overview of your financial status.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <BanknotesIcon className="w-5 h-5 mr-2" />
            Add Account
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <CurrencyDollarIcon className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            View Statistics
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            Import Data
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            No recent activity
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Start by adding an account or transaction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;