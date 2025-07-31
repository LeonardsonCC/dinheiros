import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import { Category } from '../components/CategoryManager';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

type TransactionType = 'income' | 'expense' | 'transfer';

interface Account {
  id: number;
  name: string;
}

interface TransactionData {
  id: number;
  type: TransactionType;
  amount: string;
  description: string;
  categoryIds: number[];
  date: string;
  toAccountId: string;
}

interface AxiosError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

export default function EditTransaction() {
  const { t } = useTranslation();
  const { accountId: accountIdParam, transactionId } = useParams<{ accountId: string; transactionId: string }>();
  const accountId = accountIdParam ? Number(accountIdParam) : null;
  const transactionIdNum = transactionId ? Number(transactionId) : null;
  const navigate = useNavigate();
  
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<TransactionData>({
    id: 0,
    type: 'expense',
    amount: '',
    description: '',
    categoryIds: [],
    date: new Date().toISOString(),
    toAccountId: ''
  });
  
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateInput, setDateInput] = useState(formatDateForInput(new Date().toISOString()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId || !transactionIdNum) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch accounts, categories, and transaction data in parallel
        const [transactionRes, accountsRes, categoriesRes] = await Promise.all([
          api.get(`/api/accounts/${accountId}/transactions/${transactionIdNum}`),
          api.get('/api/accounts'),
          api.get('/api/categories')
        ]);

        const transaction = transactionRes.data;
        setAccounts(accountsRes.data);
        setAllCategories(categoriesRes.data);
        
        // Filter categories based on transaction type
        const filtered = categoriesRes.data.filter((cat: Category) => cat.type === transaction.type);
        setFilteredCategories(filtered);
        
        setFormData({
          id: transaction.id,
          type: transaction.type,
          amount: Math.abs(transaction.amount).toString(),
          description: transaction.description,
          categoryIds: transaction.categories ? transaction.categories.map((c: { id: number }) => c.id) : [],
          date: transaction.date,
          toAccountId: transaction.toAccountId ? transaction.toAccountId.toString() : ''
        });
        
        setDateInput(formatDateForInput(transaction.date));
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        let errorMessage = t('editTransaction.failedLoad');
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as AxiosError;
          if (typeof err.response?.data?.error === 'string') {
            errorMessage = err.response.data.error;
          }
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, transactionIdNum]);

  // Update filtered categories when transaction type changes
  useEffect(() => {
    const filtered = allCategories.filter(cat => cat.type === formData.type);
    setFilteredCategories(filtered);
    
    // Clear selected categories if they don't match the new type
    if (formData.categoryIds.length > 0) {
      const validCategoryIds = filtered.map((c: Category) => c.id);
      const newCategoryIds = formData.categoryIds.filter((id: number) => validCategoryIds.includes(id));
      
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
      [name]: value as TransactionType
    }));
  };
  
  const handleCategoryChange = (categoryId: number) => {
    setFormData(prev => {
      const newCategoryIds = [...prev.categoryIds];
      const index = newCategoryIds.indexOf(categoryId);
      
      if (index === -1) {
        newCategoryIds.push(categoryId);
      } else {
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
    
    if (!accountId || !transactionIdNum) {
      toast.error(t('editTransaction.missingId'));
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
        description: formData.description,
        category_ids: formData.categoryIds,
        date: formData.date,
        to_account_id: formData.type === 'transfer' ? formData.toAccountId : undefined
      };

      await api.put(`/api/accounts/${accountId}/transactions/${transactionIdNum}`, payload);
      
      toast.success(t('editTransaction.updated'));
      navigate(`/accounts/${accountId}/transactions`);
    } catch (error: unknown) {
      console.error('Error updating transaction:', error);
      let errorMessage = t('editTransaction.failedUpdate');
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <GlassCard variant="elevated" animation="scale-in" className="p-8">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            <span className="ml-4 text-gray-700 dark:text-gray-300">{t('editTransaction.loading')}</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
        <GlassCard variant="elevated" animation="scale-in" className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="text-red-500 text-5xl mb-4 animate-fade-in">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('editTransaction.errorTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <GlassButton
              onClick={() => window.location.reload()}
              variant="primary"
              size="md"
            >
              {t('editTransaction.tryAgain')}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
      <GlassCard className="w-full max-w-4xl" variant="elevated" animation="slide-up">
        <div className="p-8">
          <div className="mb-8">
            <GlassButton
              onClick={() => navigate(`/accounts/${accountId}/transactions`)}
              variant="glass"
              size="sm"
              className="mb-4"
            >
              <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
              {t('editTransaction.back')}
            </GlassButton>
            <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 animate-fade-in">{t('editTransaction.title')}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Transaction Type */}
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editTransaction.type')}
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  required
                >
                  <option value="expense">{t('dashboard.expenses')}</option>
                  <option value="income">{t('dashboard.income')}</option>
                  <option value="transfer">{t('categoryManager.transfer')}</option>
                </select>
              </div>

              {/* Amount */}
              <div className="sm:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editTransaction.amount')}
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
                    className="glass-input pl-8 pr-4 py-3 block w-full rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editTransaction.description')}
                </label>
                <input
                  type="text"
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  required
                />
              </div>

              {/* Categories */}
              <div className="sm:col-span-2">
                <CategoryManager 
                  onCategoryAdded={(newCategory) => {
                    setAllCategories(prev => [...prev, newCategory]);
                    
                    // Only auto-select if the new category matches the current transaction type
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
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                        <label 
                          htmlFor={`category-${category.id}`} 
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300 truncate"
                          title={category.description}
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('editTransaction.noCategories')}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div className="sm:col-span-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editTransaction.dateTime')}
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  id="date"
                  value={dateInput}
                  onChange={handleChange}
                  className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  required
                />
              </div>

              {/* To Account (only shown for transfers) */}
              {formData.type === 'transfer' && (
                <div className="sm:col-span-2">
                  <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('editTransaction.transferToAccount')}
                  </label>
                  <select
                    id="toAccountId"
                    name="toAccountId"
                    value={formData.toAccountId}
                    onChange={handleChange}
                    className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                    required={formData.type === 'transfer'}
                  >
                    <option value="">{t('editTransaction.selectAccount')}</option>
                    {accounts
                      .filter(account => account.id !== accountId)
                      .map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <GlassButton
                type="button"
                onClick={() => navigate(`/accounts/${accountId}/transactions`)}
                variant="secondary"
                size="md"
              >
                {t('editTransaction.cancel')}
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={submitting}
                variant="primary"
                size="md"
              >
                {submitting ? t('editTransaction.saving') : t('editTransaction.saveChanges')}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
