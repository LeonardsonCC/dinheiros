import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import { Category } from '../components/CategoryManager';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loading } from '../components/ui/loading';
import { MoneyInput } from '../components/ui/money-input';

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
        setAccounts(accountsRes.data.accounts || accountsRes.data);
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
    // Transfers don't use categories
    if (formData.type === 'transfer') {
      setFilteredCategories([]);
      // Clear categories when switching to transfer
      if (formData.categoryIds.length > 0) {
        setFormData(prev => ({
          ...prev,
          categoryIds: []
        }));
      }
      return;
    }

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
          category_ids: formData.type === 'transfer' ? [] : formData.categoryIds,
          date: formData.date,
          to_account_id: formData.type === 'transfer' && formData.toAccountId ? Number(formData.toAccountId) : undefined
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
    return <Loading text={t('editTransaction.loading')} />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">{t('editTransaction.errorTitle')}</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                {t('editTransaction.tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/accounts/${accountId}/transactions`)}
          className="mb-4"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
          {t('editTransaction.back')}
        </Button>
        <h1 className="text-2xl font-bold">{t('editTransaction.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('editTransaction.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Transaction Type */}
              <div className="sm:col-span-2">
                <Label htmlFor="type">{t('editTransaction.type')}</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TransactionType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('dashboard.expenses')}</SelectItem>
                    <SelectItem value="income">{t('dashboard.income')}</SelectItem>
                    <SelectItem value="transfer">{t('categoryManager.transfer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="sm:col-span-2">
                <Label htmlFor="amount">{t('editTransaction.amount')}</Label>
                <MoneyInput
                  name="amount"
                  id="amount"
                  value={parseFloat(formData.amount) || 0}
                  onChange={(value) => setFormData(prev => ({ ...prev, amount: value.toString() }))}
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <Label htmlFor="description">{t('editTransaction.description')}</Label>
                <Input
                  type="text"
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Categories - only show for non-transfer transactions */}
              {formData.type !== 'transfer' && (
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
                     <p className="mt-1 text-sm text-muted-foreground">
                       {t('editTransaction.noCategories')}
                     </p>
                   )}
                </div>
              )}

              {/* Date & Time */}
              <div className="sm:col-span-2">
                <Label htmlFor="date">{t('editTransaction.dateTime')}</Label>
                <Input
                  type="datetime-local"
                  name="date"
                  id="date"
                  value={dateInput}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* To Account (only shown for transfers) */}
              {formData.type === 'transfer' && (
                <div className="sm:col-span-2">
                  <Label htmlFor="toAccountId">{t('editTransaction.transferToAccount')}</Label>
                  <Select 
                    value={formData.toAccountId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, toAccountId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('editTransaction.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(accounts) && accounts
                        .filter(account => account.id !== accountId)
                        .map(account => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/accounts/${accountId}/transactions`)}
              >
                {t('editTransaction.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? t('editTransaction.saving') : t('editTransaction.saveChanges')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
