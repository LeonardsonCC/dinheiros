import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import DatePicker from '../components/DatePicker';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Loading } from '@/components/ui';

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
        
        const [accountsRes, categoriesRes] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/categories')
        ]);
        
        setAccounts(accountsRes.data.accounts);
        setAllCategories(categoriesRes.data);
        const filtered = categoriesRes.data.filter((cat: Category) => cat.type === 'expense');
        setFilteredCategories(filtered);
      } catch (error: unknown) {
        let errorMessage = t('newTransaction.failedLoad');
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
  }, [accountId, t]);

  useEffect(() => {
    const filtered = allCategories.filter(cat => cat.type === formData.type);
    setFilteredCategories(filtered);
    
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
    
    const selectedAccountId = accountId || formData.accountId;
    if (!selectedAccountId) {
      toast.error(t('newTransaction.selectAccountError'));
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
        to_account_id: formData.type === 'transfer' && !isNaN(Number(formData.toAccountId)) ? Number(formData.toAccountId) : undefined
      };

      await api.post(`/api/accounts/${selectedAccountId}/transactions`, payload);
      
      toast.success(t('newTransaction.added'));
      navigate(`/accounts/${selectedAccountId}/transactions`);
    } catch (error: unknown) {
      let errorMessage = t('newTransaction.failedAdd');
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
    return <Loading text={t('newTransaction.loading')} />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <CardTitle className="mb-2">{t('newTransaction.errorTitle')}</CardTitle>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                {t('newTransaction.tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          onClick={() => navigate(accountId ? `/accounts/${accountId}/transactions` : '/accounts')}
          className="p-2"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
          {t('newTransaction.back')}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('newTransaction.addNew')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {!accountId && (
                <div className="sm:col-span-2">
                  <label htmlFor="accountId" className="block text-sm font-medium mb-2">
                    {t('newTransaction.account')}
                  </label>
                  <Select value={formData.accountId} onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('newTransaction.account')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.length > 0 ? accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      )) : (
                        <SelectItem value="" disabled>{t('importTransactions.noAccounts')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  {t('newTransaction.transactionType')}
                </label>
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

              <div className="sm:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium mb-2">
                  {t('newTransaction.amount')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  {t('newTransaction.description')}
                </label>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('newTransaction.description')}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  {t('newTransaction.categories')}
                </label>
                <div className="space-y-4">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredCategories.map(category => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={() => handleCategoryChange(category.id)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                            title={category.description}
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('newTransaction.categories')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  {t('newTransaction.dateTime')}
                </label>
                <DatePicker
                  label=""
                  value={dateInput}
                  onChange={(value) => {
                    setDateInput(value);
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                      setFormData(prev => ({ ...prev, date: date.toISOString() }));
                    }
                  }}
                />
              </div>
              
              {formData.type === 'transfer' && (
                <div className="sm:col-span-2">
                  <label htmlFor="toAccountId" className="block text-sm font-medium mb-2">
                    {t('newTransaction.toAccount')}
                  </label>
                  <Select value={formData.toAccountId} onValueChange={(value) => setFormData(prev => ({ ...prev, toAccountId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('newTransaction.toAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.length > 0 ? accounts
                        .filter(account => account.id !== accountId)
                        .map(account => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        )) : (
                        <SelectItem value="" disabled>{t('importTransactions.noAccounts')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(accountId ? `/accounts/${accountId}/transactions` : '/accounts')}
              >
                {t('newTransaction.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t('newTransaction.saving') : t('newTransaction.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}