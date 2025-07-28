import React from 'react';
import { useTranslation } from 'react-i18next';

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

interface SimpleTransactionsTableProps {
  transactions: Transaction[];
}

const SimpleTransactionsTable: React.FC<SimpleTransactionsTableProps> = ({ 
  transactions
}) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('transactionsTable.date')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('transactionsTable.description')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('transactionsTable.account')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('transactionsTable.categories')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('transactionsTable.amount')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {t('transactionsTable.noTransactions')}
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {transaction.description || t('transactionsTable.noDescription')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {t(`transactionsTable.type.${transaction.type}`)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {transaction.account?.name || t('transactionsTable.na')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {transaction.categories.length > 0 ? (
                      transaction.categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {category.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('transactionsTable.na')}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                  transaction.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : transaction.type === 'expense'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {transaction.type === 'expense' ? '-' : ''}
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleTransactionsTable;