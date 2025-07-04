import { useState, useEffect, useCallback, Fragment, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PlusIcon, FunnelIcon, XMarkIcon, CheckIcon, ChevronUpDownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import TransactionsTable from '../components/TransactionsTable';
import Loading from '../components/Loading';
import DatePicker from '../components/DatePicker';
import { useTranslation } from 'react-i18next';

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
  type: 'income' | 'expense' | 'transfer';
  description: string;
  date: string;
  categories: Category[];
  account: Account;
  toAccount?: Account;
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

// Types for MultiSelectDropdown
interface SelectOption {
  id: number;
  name: string;
}

interface MultiSelectDropdownProps {
  options: SelectOption[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
}

// MultiSelectDropdown component
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>(selected);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((option: SelectOption) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionId: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const newSelected = selected.includes(optionId)
      ? selected.filter((id: number) => id !== optionId)
      : [...selected, optionId];
    setSelectedItems(newSelected);
    onChange(newSelected);
  };

  const removeOption = (optionId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelected = selected.filter((id: number) => id !== optionId);
    setSelectedItems(newSelected);
    onChange(newSelected);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems([]);
    onChange([]);
  };

  return (
    <Listbox as="div" className="relative" value={selectedItems} multiple ref={dropdownRef}>
      {() => (
        <>
          <div className="relative">
            <Listbox.Button
              className="relative w-full cursor-default rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              onClick={() => {
                setIsOpen(!isOpen);
                setSearchTerm('');
              }}
            >
              <div className="flex flex-wrap gap-1">
                {selectedItems.length === 0 ? (
                  <span className="text-gray-500 dark:text-gray-400 truncate">{placeholder}</span>
                ) : (
                  selectedItems.map((id: number) => {
                    const option = options.find((opt: SelectOption) => opt.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center rounded bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 text-sm font-medium text-indigo-800 dark:text-indigo-200"
                      >
                        {option?.name}
                        <XCircleIcon
                          className="ml-1 h-4 w-4 text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-100"
                          onClick={(e) => removeOption(id, e)}
                        />
                      </span>
                    );
                  })
                )}
              </div>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={isOpen}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                static
                className="mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none sm:text-sm"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-700 p-2">
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder={t('allTransactions.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchTerm('');
                        }}
                      >
                        <XMarkIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
                {filteredOptions.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-400">
                    {t('allTransactions.noItems')}
                  </div>
                ) : (
                  filteredOptions.map((option: SelectOption) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-indigo-100 dark:bg-indigo-600 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-200'
                        }`
                      }
                      value={option.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleOption(option.id, e);
                      }}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option?.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))
                )}
                {selectedItems.length > 0 && (
                  <div className="sticky bottom-0 z-10 border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2">
                    <button
                      type="button"
                      className="w-full rounded-md border border-transparent bg-white dark:bg-gray-600 px-3 py-1.5 text-left text-sm font-medium text-indigo-600 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAll(e);
                      }}
                    >
                      {t('allTransactions.clearAll')}
                    </button>
                  </div>
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default function AllTransactions() {
  const { t } = useTranslation();

  // Router hooks
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
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
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error(t('allTransactions.failedLoadAccounts'));
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch transactions when filters, pagination, or sort changes
  const fetchTransactions = useCallback(async () => {
    try {
      if (!loading) setTableLoading(true);
      setLoading(true);
      
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
      
      const response = await api.get(`/api/transactions?${params.toString()}`);
      
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Show loading state
  if (loading && transactions.length === 0) {
    return <Loading message="Loading transactions..." />;
  }

  // Handle delete transaction
  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('allTransactions.title')}</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            {t('allTransactions.subtitle', {
              from: pagination.currentPage * pagination.pageSize - pagination.pageSize + 1,
              to: pagination.currentPage * pagination.pageSize,
              total: pagination.totalItems,
            })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            {showFilters ? t('allTransactions.hideFilters') : t('allTransactions.showFilters')}
          </button>
          <Link
            to="/accounts/transactions/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {t('allTransactions.addTransaction')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6 relative" style={{ overflow: 'visible' }}>
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
                {['income', 'expense', 'transfer'].map((type) => (
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
              <MultiSelectDropdown
                options={accounts.map(account => ({
                  id: account.id,
                  name: account.name
                }))}
                selected={filters.accountIds}
                onChange={(selected) => handleFilterChange('accountIds', selected)}
                placeholder={t('allTransactions.selectAccounts')}
              />
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('allTransactions.categories')}</label>
              <MultiSelectDropdown
                options={categories.map(category => ({
                  id: category.id,
                  name: category.name
                }))}
                selected={filters.categoryIds}
                onChange={(selected) => handleFilterChange('categoryIds', selected)}
                placeholder={t('allTransactions.selectCategories')}
              />
            </div>

            {/* Amount range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="min-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('allTransactions.minAmount')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="min-amount"
                    id="min-amount"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="max-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('allTransactions.maxAmount')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="max-amount"
                    id="max-amount"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="1000.00"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label={t('allTransactions.startDate')}
                value={filters.startDate}
                onChange={value => handleFilterChange('startDate', value ? value.slice(0, 10) : "")}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              <DatePicker
                label={t('allTransactions.endDate')}
                value={filters.endDate}
                onChange={value => handleFilterChange('endDate', value ? value.slice(0, 10) : "")}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
            </div>

            {/* Reset filters button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                {t('allTransactions.resetAllFilters')}
              </button>
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
    </div>
  );
}
