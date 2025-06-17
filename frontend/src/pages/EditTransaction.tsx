import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import { Category } from '../components/CategoryManager';

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

export default function EditTransaction() {
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
  
  const [categories, setCategories] = useState<Category[]>([]);
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
        const [accountsRes, categoriesRes, transactionRes] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/categories'),
          api.get(`/api/accounts/${accountId}/transactions/${transactionIdNum}`)
        ]);
        
        setAccounts(accountsRes.data);
        setCategories(categoriesRes.data);
        
        const transaction = transactionRes.data;
        setFormData({
          id: transaction.id,
          type: transaction.type,
          amount: Math.abs(transaction.amount).toString(),
          description: transaction.description,
          categoryIds: transaction.categories ? transaction.categories.map((c: any) => c.id) : [],
          date: transaction.date,
          toAccountId: transaction.toAccountId ? transaction.toAccountId.toString() : ''
        });
        
        setDateInput(formatDateForInput(transaction.date));
      } catch (error: any) {
        console.error('Error fetching data:', error);
        const errorMessage = error.response?.data?.error || 'Failed to load transaction data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, transactionIdNum]);

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
      [name]: value
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
      toast.error('Missing account or transaction ID');
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
      
      toast.success('Transaction updated successfully');
      navigate(`/accounts/${accountId}/transactions`);
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to update transaction');
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Transaction</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Try Again
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
            Back to Transactions
          </button>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Transaction</h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Transaction Type */}
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Transaction Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Amount */}
              <div className="sm:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
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
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>

              {/* Categories */}
              <div className="sm:col-span-2">
                <CategoryManager 
                  categories={categories} 
                  onCategoryAdded={(newCategory) => {
                    setCategories(prev => [...prev, newCategory]);
                    setFormData(prev => ({
                      ...prev,
                      categoryIds: [...prev.categoryIds, newCategory.ID]
                    }));
                  }} 
                />
                
                {categories.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map(category => (
                      <div key={category.ID} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`category-${category.ID}`}
                          checked={formData.categoryIds.includes(category.ID)}
                          onChange={() => handleCategoryChange(category.ID)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label 
                          htmlFor={`category-${category.ID}`} 
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
                    No categories yet. Click 'Add Category' to create one.
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div className="sm:col-span-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  id="date"
                  value={dateInput}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>

              {/* To Account (only shown for transfers) */}
              {formData.type === 'transfer' && (
                <div className="sm:col-span-2">
                  <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700">
                    Transfer To Account
                  </label>
                  <select
                    id="toAccountId"
                    name="toAccountId"
                    value={formData.toAccountId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required={formData.type === 'transfer'}
                  >
                    <option value="">Select an account</option>
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

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/accounts/${accountId}/transactions`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
