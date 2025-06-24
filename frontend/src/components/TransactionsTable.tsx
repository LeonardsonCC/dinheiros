import React from 'react';
import { useTranslation } from 'react-i18next';

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  date: string;
  categories: Category[];
  account: Account;
  toAccount?: Account;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  pagination: PaginationState;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSort: (key: keyof Transaction) => void;
  getSortIndicator: (key: keyof Transaction) => React.ReactNode;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  renderActions?: (transaction: Transaction) => React.ReactNode; // Optional actions column
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  getSortIndicator,
  formatCurrency,
  formatDate,
  renderActions,
}) => {
  const { t } = useTranslation();
  return (
    <div className="mt-8 flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer hover:bg-gray-100"
                    onClick={() => onSort('date')}
                  >
                    <div className="flex items-center">
                      {t('transactionsTable.date')}
                      <span className="ml-1">{getSortIndicator('date')}</span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => onSort('description')}
                  >
                    <div className="flex items-center">
                      {t('transactionsTable.description')}
                      <span className="ml-1">{getSortIndicator('description')}</span>
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {t('transactionsTable.account')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {t('transactionsTable.categories')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => onSort('amount')}
                  >
                    <div className="flex justify-end items-center">
                      {t('transactionsTable.amount')}
                      <span className="ml-1">{getSortIndicator('amount')}</span>
                    </div>
                  </th>
                  {renderActions && (
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      {t('transactionsTable.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={renderActions ? 6 : 5} className="px-3 py-4 text-sm text-gray-500 text-center">
                      {loading ? t('transactionsTable.loading') : t('transactionsTable.noTransactions')}
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="font-medium text-gray-900">{transaction.description || t('transactionsTable.noDescription')}</div>
                        <div className="text-gray-500 capitalize">{t(`transactionsTable.type.${transaction.type}`)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {transaction.account?.name || t('transactionsTable.na')}
                        {transaction.toAccount && (
                          <span className="text-gray-400"> → {transaction.toAccount.name}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {transaction.categories.length > 0 ? (
                            transaction.categories.map((category) => (
                              <span
                                key={category.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {category.name}
                              </span>
                            ))
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">
                              {t('transactionsTable.na')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={`whitespace-nowrap px-3 py-4 text-sm font-medium text-right ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-blue-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </td>
                      {renderActions && (
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          {renderActions(transaction)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('transactionsTable.previous')}
                  </button>
                  <button
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('transactionsTable.next')}
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      {t('transactionsTable.showing', {
                        from: (pagination.currentPage - 1) * pagination.pageSize + 1,
                        to: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems),
                        total: pagination.totalItems
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <label htmlFor="per-page" className="mr-2 text-sm text-gray-700">
                        {t('transactionsTable.size')}
                      </label>
                      <select
                        id="per-page"
                        value={pagination.pageSize}
                        onChange={onPageSizeChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {[5, 10, 25, 50].map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => onPageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{t('transactionsTable.first')}</span>
                        <span>&laquo;</span>
                      </button>
                      <button
                        onClick={() => onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{t('transactionsTable.previous')}</span>
                        <span>&lsaquo;</span>
                      </button>
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.currentPage === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{t('transactionsTable.next')}</span>
                        <span>&rsaquo;</span>
                      </button>
                      <button
                        onClick={() => onPageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{t('transactionsTable.last')}</span>
                        <span>&raquo;</span>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
