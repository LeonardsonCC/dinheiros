import { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, FunnelIcon, XMarkIcon, CheckIcon, ChevronUpDownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

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
              className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              onClick={() => {
                setIsOpen(!isOpen);
                setSearchTerm('');
              }}
            >
              <div className="flex flex-wrap gap-1">
                {selectedItems.length === 0 ? (
                  <span className="text-gray-500 truncate">{placeholder}</span>
                ) : (
                  selectedItems.map((id: number) => {
                    const option = options.find((opt: SelectOption) => opt.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 text-sm font-medium text-indigo-800"
                      >
                        {option?.name}
                        <XCircleIcon
                          className="ml-1 h-4 w-4 text-indigo-500 hover:text-indigo-700"
                          onClick={(e) => removeOption(id, e)}
                        />
                      </span>
                    );
                  })
                )}
              </div>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
                className="mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
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
                <div className="sticky top-0 z-10 bg-white p-2">
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Search..."
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
                        <XMarkIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                {filteredOptions.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    No items found.
                  </div>
                ) : (
                  filteredOptions.map((option: SelectOption) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
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
                            {option.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))
                )}
                {selectedItems.length > 0 && (
                  <div className="sticky bottom-0 z-10 border-t border-gray-100 bg-gray-50 p-2">
                    <button
                      type="button"
                      className="w-full rounded-md border border-transparent bg-white px-3 py-1.5 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAll(e);
                      }}
                    >
                      Clear all
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
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    description: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    types: [],
    accountIds: [],
    categoryIds: [],
  });
  
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
        toast.error('Failed to load accounts and categories');
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch transactions when filters, pagination, or sort changes
  const fetchTransactions = useCallback(async () => {
    try {
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
      toast.error('Failed to load transactions');
      setTransactions([]);
      setPagination(prev => ({
        ...prev,
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.pageSize, sortConfig]);
  
  // Fetch transactions when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  // Handle filter changes
  const handleFilterChange = (field: keyof FilterState, value: any) => {
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
      setPagination(prev => ({
        ...prev,
        currentPage: newPage,
      }));
      window.scrollTo(0, 0);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination(prev => ({
      ...prev,
      pageSize: Number(e.target.value),
      currentPage: 1, // Reset to first page when changing page size
    }));
  };
  
  // Handle sorting
  const handleSort = (key: keyof Transaction) => {
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">All Transactions</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all your transactions in one place.
            {pagination.totalItems > 0 && (
              <span className="ml-2 text-gray-500">
                (Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} transactions)
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <Link
            to="/transactions/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-6 bg-white shadow rounded-lg p-6 relative" style={{ overflow: 'visible' }}>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Description filter */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={filters.description}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search transactions..."
              />
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="space-x-4 flex">
                {['income', 'expense', 'transfer'].map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      id={`type-${type}`}
                      name="transaction-type"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={filters.types.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.types, type]
                          : filters.types.filter((t) => t !== type);
                        handleFilterChange('types', newTypes);
                      }}
                    />
                    <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700 capitalize">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Account filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accounts</label>
              <MultiSelectDropdown
                options={accounts.map(account => ({
                  id: account.id,
                  name: account.name
                }))}
                selected={filters.accountIds}
                onChange={(selected) => handleFilterChange('accountIds', selected)}
                placeholder="Select accounts..."
              />
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <MultiSelectDropdown
                options={categories.map(category => ({
                  id: category.id,
                  name: category.name
                }))}
                selected={filters.categoryIds}
                onChange={(selected) => handleFilterChange('categoryIds', selected)}
                placeholder="Select categories..."
              />
            </div>

            {/* Amount range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="min-amount" className="block text-sm font-medium text-gray-700">
                  Min Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="min-amount"
                    id="min-amount"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="max-amount" className="block text-sm font-medium text-gray-700">
                  Max Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="max-amount"
                    id="max-amount"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="1000.00"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Reset filters button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
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
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        <span className="ml-1">{getSortIndicator('date')}</span>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center">
                        Description
                        <span className="ml-1">{getSortIndicator('description')}</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Account
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Categories
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex justify-end items-center">
                        Amount
                        <span className="ml-1">{getSortIndicator('amount')}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 text-center">
                        {loading ? 'Loading transactions...' : 'No transactions found'}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="font-medium text-gray-900">{transaction.description || 'No description'}</div>
                          <div className="text-gray-500 capitalize">{transaction.type}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {transaction.account?.name || 'N/A'}
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
                              <span className="text-gray-400">No categories</span>
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
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.totalItems}</span> results
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <label htmlFor="per-page" className="mr-2 text-sm text-gray-700">
                          Rows per page:
                        </label>
                        <select
                          id="per-page"
                          value={pagination.pageSize}
                          onChange={handlePageSizeChange}
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
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">First</span>
                          <span>«</span>
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <span>‹</span>
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          // Calculate which pages to show (current page in the middle when possible)
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
                              onClick={() => handlePageChange(pageNum)}
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
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <span>›</span>
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Last</span>
                          <span>»</span>
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
    </div>
  );
}
