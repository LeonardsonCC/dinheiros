import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import DatePicker from '../components/DatePicker';
import { useTranslation } from 'react-i18next';

interface Account {
  id: number;
  name: string;
}

import { Category } from '../components/CategoryManager';

type TransactionType = 'income' | 'expense' | 'transfer';

interface AxiosError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

export default function NewTransaction() {
  const { t } = useTranslation();
  const { accountId: accountIdParam } = useParams<{ accountId: string }>();
  const accountId = accountIdParam ? Number(accountIdParam) : null;
  const navigate = useNavigate();
  
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    description: '',
    categoryIds: [] as number[],
    date: new Date().toISOString(),
    toAccountId: '',
    accountId: accountId ? accountId.toString() : ''
  });
  
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateInput, setDateInput] = useState(formatDateForInput(new Date()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch accounts and categories in parallel
        const [accountsRes, categoriesRes] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/categories')
        ]);
        
        setAccounts(accountsRes.data.accounts);
        setAllCategories(categoriesRes.data);
        // Initial filter based on default type ('expense')
        const filtered = categoriesRes.data.filter((cat: Category) => cat.type === 'expense');
        setFilteredCategories(filtered);
      } catch (error: unknown) {
        let errorMessage = 'Failed to load data';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as AxiosError;
          if (typeof err.response?.data?.error === 'string') {
            errorMessage = err.response.data.error;
          }
        }
        console.error('Error fetching data:', error);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId]);

  // Update filtered categories when transaction type changes
  useEffect(() => {
    const filtered = allCategories.filter(cat => cat.type === formData.type);
    setFilteredCategories(filtered);
    
    // Clear selected categories if they don't match the new type
    if (formData.categoryIds.length > 0) {
      const validCategoryIds = filtered.map(c => c.id);
      const newCategoryIds = formData.categoryIds.filter(id => validCategoryIds.includes(id));
      
      if (newCategoryIds.length !== formData.categoryIds.length) {
        setFormData(prev => ({
          ...prev,
          categoryIds: newCategoryIds
        }));
      }
    }
  }, [formData.type, allCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      setDateInput(value);
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setFormData(prev => ({
          ...prev,
          date: date.toISOString()
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'accountId' ? value : value as TransactionType
    }));
  };
  
  const handleCategoryChange = (categoryId: number) => {
    setFormData(prev => {
      // Create a new array to avoid mutating the state directly
      const newCategoryIds = [...prev.categoryIds];
      const index = newCategoryIds.indexOf(categoryId);
      
      if (index === -1) {
        // Add the category ID if it's not already in the array
        newCategoryIds.push(categoryId);
      } else {
        // Remove the category ID if it's already in the array
        newCategoryIds.splice(index, 1);
      }
      
      return {
        ...prev,
        categoryIds: newCategoryIds
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedAccountId = accountId || formData.accountId;
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_ids: formData.categoryIds,
        date: formData.date,
        to_account_id: formData.type === 'transfer' ? formData.toAccountId : undefined
      };

      await api.post(`/api/accounts/${selectedAccountId}/transactions`, payload);
      
      toast.success('Transaction added successfully');
      navigate(`/accounts/${selectedAccountId}/transactions`);
    } catch (error: unknown) {
      let errorMessage = 'Failed to add transaction';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Error creating transaction:', error);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('importTransactions.loading')}</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('importTransactions.import')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/accounts/${accountId}/transactions`)}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
          >
            <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
            {t('newTransaction.back')}
          </button>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{t('newTransaction.addNew')}</h1>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Account Selection (only shown when accountId is not in URL) */}
              {!accountId && (
                <div className="sm:col-span-2">
                  <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
                    {t('newTransaction.account')}
                  </label>
                  <select
                    id="accountId"
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  >
                    <option value="">{t('newTransaction.account')}</option>
                    {accounts.length > 0 ? accounts.map(account => (
                      <option key={account.id} value={account.id.toString()}>
                        {account.name}
                      </option>
                    )) : <option value="">{t('importTransactions.noAccounts')}</option>}
                  </select>
                </div>
              )}
              {/* Transaction Type */}
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  {t('newTransaction.transactionType')}
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                >
                  <option value="expense">{t('dashboard.expenses')}</option>
                  <option value="income">{t('dashboard.income')}</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              {/* Amount */}
              <div className="sm:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  {t('newTransaction.amount')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="amount"
                    id="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="pl-8 pr-4 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('newTransaction.description')}
                </label>
                <input
                  type="text"
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              {/* Categories */}
              <div className="sm:col-span-2">
                <CategoryManager 
                  initialType={formData.type}
                  onCategoryAdded={(newCategory) => {
                    setAllCategories(prev => [...prev, newCategory]);
                    if (newCategory.type === formData.type) {
                      setFilteredCategories(prev => [...prev, newCategory]);
                      setFormData(prev => ({
                        ...prev,
                        categoryIds: [...prev.categoryIds, newCategory.id]
                      }));
                    }
                  }} 
                />
                {filteredCategories.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredCategories.map(category => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label 
                          htmlFor={`category-${category.id}`} 
                          className="ml-2 block text-sm text-gray-700 truncate"
                          title={category.description}
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    {t('newTransaction.categories')}
                  </p>
                )}
              </div>
              {/* Date & Time */}
              <div className="sm:col-span-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  {t('newTransaction.dateTime')}
                </label>
                <DatePicker
                  label=""
                  value={dateInput}
                  onChange={setDateInput}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              {/* To Account (only for transfers) */}
              {formData.type === 'transfer' && (
                <div className="sm:col-span-2">
                  <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700">
                    {t('newTransaction.toAccount')}
                  </label>
                  <select
                    id="toAccountId"
                    name="toAccountId"
                    value={formData.toAccountId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required={formData.type === 'transfer'}
                  >
                    <option value="">{t('newTransaction.toAccount')}</option>
                    {accounts.length > 0 ? accounts
                      .filter(account => account.id !== accountId)
                      .map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      )): <option value="">{t('importTransactions.noAccounts')}</option>}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate(`/accounts/${accountId}/transactions`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
              >
                {t('newTransaction.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('newTransaction.saving') : t('newTransaction.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
