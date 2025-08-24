import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PlusIcon, FunnelIcon, XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import TransactionsTable from '../components/TransactionsTable';
import Loading from '../components/Loading';
import DatePicker from '../components/DatePicker';
import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency } from '../lib/utils';
import { MoneyInput } from '../components/ui/money-input';
import { Button } from '../components/ui/button';
import { CategoryMultiSelect } from '../components/ui/category-multi-select';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useConfirmation } from '../hooks/useConfirmation';
import { MultiSelect } from '@/components/ui';

// Type definitions
interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  categories: Category[];
  account: Account;

  attached_transaction?: {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    account: Account;
  };
  attachment_type?: 'outbound_transfer' | 'inbound_transfer';
}

interface FilterState {
  description: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  types: string[];
  accountIds: number[];
  categoryIds: number[];
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}





export default function AllTransactions() {
  const { t } = useTranslation();
  const { confirm, confirmationProps } = useConfirmation();

  // Router hooks
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Parse filters from URL search params
  const initialFilters = useMemo<FilterState>(() => ({
    description: searchParams.get('description') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    types: searchParams.getAll('types') || [],
    accountIds: searchParams.getAll('accountIds').map(Number).filter(id => !isNaN(id)),
    categoryIds: searchParams.getAll('categoryIds').map(Number).filter(id => !isNaN(id)),
  }), [searchParams]);

  // Filters state
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });

  // Fetch accounts and categories
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/categories'),
        ]);
        setAccounts(accountsRes.data.accounts);
        setCategories(categoriesRes.data);
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error(t('allTransactions.failedLoadAccounts'));
        setInitialDataLoaded(true); // Even if failed, mark as loaded to show empty state
      }
    };

    fetchInitialData();
  }, []);

  // Fetch transactions when filters, pagination, or sort changes
  const fetchTransactions = useCallback(async () => {
    try {
      if (!loading) setTableLoading(true);

      // Build query params
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        page_size: pagination.pageSize.toString(),
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction,
      });

      // Add filters to params
      if (filters.description) params.append('description', filters.description);
      if (filters.minAmount) params.append('min_amount', filters.minAmount);
      if (filters.maxAmount) params.append('max_amount', filters.maxAmount);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      filters.types.forEach(type => params.append('types', type));
      filters.accountIds.forEach(id => params.append('account_ids', id.toString()));
      filters.categoryIds.forEach(id => params.append('category_ids', id.toString()));

      const response = await api.get(`/api/transactions/search?${params.toString()}`);

      setTransactions(response.data.data);
      setPagination(prev => ({
        ...prev,
        totalItems: response.data.pagination.total_items,
        totalPages: response.data.pagination.total_pages,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error(t('allTransactions.failedLoadTransactions'));
      setTransactions([]);
      setPagination(prev => ({
        ...prev,
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      }));
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.pageSize, sortConfig]);

  // Fetch transactions when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    // Add filters to params if they have values
    if (filters.description) params.set('description', filters.description);
    if (filters.minAmount) params.set('minAmount', filters.minAmount);
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    // Handle array parameters
    params.delete('types');
    filters.types.forEach(type => params.append('types', type));

    params.delete('accountIds');
    filters.accountIds.forEach(id => params.append('accountIds', id.toString()));

    params.delete('categoryIds');
    filters.categoryIds.forEach(id => params.append('categoryIds', id.toString()));

    // Update URL without causing a navigation
    navigate({ search: params.toString() }, { replace: true });
  }, [filters, navigate]);

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterState, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setTableLoading(true);
      setPagination(prev => ({
        ...prev,
        currentPage: newPage,
      }));
      window.scrollTo(0, 0);
    }
  };
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTableLoading(true);
    setPagination(prev => ({
      ...prev,
      pageSize: Number(e.target.value),
      currentPage: 1, // Reset to first page when changing page size
    }));
  };
  // Handle sorting
  const handleSort = (key: keyof Transaction) => {
    setTableLoading(true);
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      description: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
      types: [],
      accountIds: [],
      categoryIds: [],
    });
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof Transaction) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };





  // Show loading state
  if (loading && transactions.length === 0) {
    return <Loading message={t('transactionsTable.loading')} />;
  }

  // Handle delete transaction
  const handleDeleteTransaction = async (transaction: Transaction) => {
    const confirmed = await confirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }
    setDeletingId(transaction.id);
    try {
      // Use account.id from transaction object
      await api.delete(`/api/accounts/${transaction.account.id}/transactions/${transaction.id}`);
      toast.success('Transaction deleted successfully');
      // Refresh transactions
      fetchTransactions();
    } catch (err: unknown) {
      let errorMessage = 'Failed to delete transaction';
      // Type guard for AxiosError
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (err as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-3">
            <BanknotesIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{t('allTransactions.title')}</h1>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            {t('allTransactions.subtitle', {
              from: pagination.currentPage * pagination.pageSize - pagination.pageSize + 1,
              to: pagination.currentPage * pagination.pageSize,
              total: pagination.totalItems,
            })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-3">
          <Button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
            {showFilters ? t('allTransactions.hideFilters') : t('allTransactions.showFilters')}
          </Button>
          <Button asChild>
            <Link to="/accounts/transactions/new">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {t('allTransactions.addTransaction')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6 relative mb-6" style={{ overflow: 'visible' }}>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('allTransactions.filters')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Description filter */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('allTransactions.description')}
              </label>
              <input
                type="text"
                id="description"
                value={filters.description}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder={t('allTransactions.searchTransactions')}
              />
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('allTransactions.type')}</label>
              <div className="space-x-4 flex">
                {['income', 'expense'].map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      id={`type-${type}`}
                      name="transaction-type"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                      checked={filters.types.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.types, type]
                          : filters.types.filter((t) => t !== type);
                        handleFilterChange('types', newTypes);
                      }}
                    />
                    <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Account filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('allTransactions.accounts')}</label>
              {!initialDataLoaded ? (
                <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading accounts...
                </div>
              ) : accounts.length > 0 ? (
                <MultiSelect
                  options={accounts.map(account => ({
                    id: account.id,
                    name: account.name
                  }))}
                  selected={filters.accountIds}
                  onChange={(selected) => handleFilterChange('accountIds', selected)}
                  placeholder={t('allTransactions.selectAccounts')}
                />
              ) : (
                <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  No accounts available
                </div>
              )}
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('allTransactions.categories')}</label>
              {!initialDataLoaded ? (
                <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading categories...
                </div>
              ) : categories.length > 0 ? (
                <MultiSelect
                  options={categories.map(category => ({
                    id: category.id,
                    name: category.name
                  }))}
                  selected={filters.categoryIds}
                  onChange={(selected) => handleFilterChange('categoryIds', selected)}
                  placeholder={t('allTransactions.selectCategories')}
                />
              ) : (
                <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  No categories available - <Link to="/categories" className="text-primary hover:underline ml-1">Create some first</Link>
                </div>
              )}
            </div>

            {/* Amount range */}
            <div className="grid grid-cols-2 gap-4">
              <div className='flex flex-col space-y-2'>
                <label htmlFor="min-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('allTransactions.minAmount')}
                </label>
                <div className="mt-1">
                  <MoneyInput
                    name="min-amount"
                    id="min-amount"
                    value={parseFloat(filters.minAmount) || 0}
                    onChange={(value) => handleFilterChange('minAmount', value.toString())}
                    placeholder="0,00"
                    allowNegative={true}
                  />
                </div>
              </div>
              <div className='flex flex-col space-y-2'>
                <label htmlFor="max-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('allTransactions.maxAmount')}
                </label>
                <div className="mt-1">
                  <MoneyInput
                    name="max-amount"
                    id="max-amount"
                    value={parseFloat(filters.maxAmount) || 0}
                    onChange={(value) => handleFilterChange('maxAmount', value.toString())}
                    placeholder="1000,00"
                    allowNegative={true}
                  />
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="allTransactions.startDate"
                value={filters.startDate}
                onChange={value => handleFilterChange('startDate', value ? value.slice(0, 10) : "")}
              />
              <DatePicker
                label="allTransactions.endDate"
                value={filters.endDate}
                onChange={value => handleFilterChange('endDate', value ? value.slice(0, 10) : "")}
              />
            </div>

            {/* Reset filters button */}
            <div className="flex items-end">
              <Button
                type="button"
                onClick={resetFilters}
                variant="secondary"
                className="inline-flex items-center"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                {t('allTransactions.resetAllFilters')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions}
        loading={tableLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        getSortIndicator={getSortIndicator}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        renderActions={(transaction: Transaction) => (
          <div className="flex items-center space-x-3 justify-center">
            <Link
              to={`/accounts/${transaction.account.id}/transactions/${transaction.id}/edit`}
              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
            >
              {t('allTransactions.edit')}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              type="button"
              onClick={() => handleDeleteTransaction(transaction)}
              disabled={deletingId === transaction.id}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 text-sm"
            >
              {deletingId === transaction.id ? t('allTransactions.deleting') : t('allTransactions.delete')}
            </button>
          </div>
        )}
      />
      <ConfirmationModal {...confirmationProps} />
    </div>
  );
}
