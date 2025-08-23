import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import DatePicker from '../components/DatePicker';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Loading, SearchableSelect } from '@/components/ui';
import { MoneyInput } from '@/components/ui/money-input';

interface Account {
  id: number;
  name: string;
}

import { Category } from '../components/CategoryManager';

type TransactionType = 'income' | 'expense';

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
  


  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    description: '',
    categoryIds: [] as number[],
    date: new Date().toISOString(),
    attachToTransactionId: 'none',
    accountId: accountId ? accountId.toString() : ''
  });
  
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [availableTransactions, setAvailableTransactions] = useState<any[]>([]);
  const [selectedSearchAccountId, setSelectedSearchAccountId] = useState<string>('none');
  const [searchingTransactions, setSearchingTransactions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const searchTransactionsByAccount = async (searchAccountId: string) => {
    if (!searchAccountId || searchAccountId === 'none') {
      setAvailableTransactions([]);
      return;
    }

    try {
      setSearchingTransactions(true);
      const response = await api.get(`/api/accounts/${searchAccountId}/transactions`);
      
      // Filter out transactions that already have attachments
      const unattachedTransactions = response.data.filter((tx: any) => 
        !tx.attached_transaction && !tx.attachment_type
      );
      
      setAvailableTransactions(unattachedTransactions);
    } catch (error) {
      console.error('Error searching transactions:', error);
      toast.error(t('newTransaction.failedLoadTransactions'));
      setAvailableTransactions([]);
    } finally {
      setSearchingTransactions(false);
    }
  };

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

  // Auto-fill form when transaction is selected for attachment
  useEffect(() => {
    if (formData.attachToTransactionId && formData.attachToTransactionId !== 'none') {
      const selectedTransaction = availableTransactions.find(tx => 
        tx.id.toString() === formData.attachToTransactionId
      );
      
      if (selectedTransaction) {
        // Determine opposite transaction type for the attachment
        const oppositeType: TransactionType = selectedTransaction.type === 'expense' ? 'income' : 'expense';
        
        setFormData(prev => ({
          ...prev,
          type: oppositeType,
          amount: Math.abs(selectedTransaction.amount).toString(),
          description: selectedTransaction.description || '',
          date: selectedTransaction.date,
          categoryIds: [] // Clear categories so user can select appropriate ones for their account
        }));
      }
    }
  }, [formData.attachToTransactionId, availableTransactions]);

  // Helper to determine if fields should be disabled when transaction is attached
  const isAttachmentSelected = Boolean(formData.attachToTransactionId && formData.attachToTransactionId !== 'none');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
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
        attached_transaction_id: formData.attachToTransactionId && formData.attachToTransactionId !== 'none' && !isNaN(Number(formData.attachToTransactionId)) ? Number(formData.attachToTransactionId) : undefined
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
                        <SelectItem value="none" disabled>{t('importTransactions.noAccounts')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  {t('newTransaction.transactionType')}
                </label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TransactionType }))}
                  disabled={isAttachmentSelected}
                >
                  <SelectTrigger className={isAttachmentSelected ? "opacity-50" : undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('dashboard.expenses')}</SelectItem>
                    <SelectItem value="income">{t('dashboard.income')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium mb-2">
                  {t('newTransaction.amount')}
                </label>
                <MoneyInput
                  name="amount"
                  value={parseFloat(formData.amount) || 0}
                  onChange={(value) => setFormData(prev => ({ ...prev, amount: value.toString() }))}
                  placeholder="0,00"
                  required
                  disabled={isAttachmentSelected}
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
                  disabled={isAttachmentSelected}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  {t('newTransaction.categories')}
                </label>
                {isAttachmentSelected && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('newTransaction.selectCategoriesForYourAccount')}
                  </p>
                )}
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
                <DatePicker
                  label="newTransaction.date"
                  value={formData.date}
                  onChange={(value) => {
                    if (value) {
                      setFormData(prev => ({ ...prev, date: value }));
                    }
                  }}
                  disabled={isAttachmentSelected}
                />
                {isAttachmentSelected && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span>🔗</span>
                    {t('newTransaction.fieldsAutoFilledFromAttachment')}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="searchAccountId" className="block text-sm font-medium mb-2">
                  {t('newTransaction.searchTransactionsInAccount')} ({t('newTransaction.optional')})
                </label>
                <Select 
                  value={selectedSearchAccountId} 
                  onValueChange={(value) => {
                    setSelectedSearchAccountId(value);
                    searchTransactionsByAccount(value);
                    // Reset attachment selection when changing search account
                    if (formData.attachToTransactionId !== 'none') {
                      setFormData(prev => ({ ...prev, attachToTransactionId: 'none' }));
                    }
                  }}
                  disabled={isAttachmentSelected}
                >
                  <SelectTrigger className={isAttachmentSelected ? "opacity-50" : undefined}>
                    <SelectValue placeholder={t('newTransaction.selectAccountToSearch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('newTransaction.noAccountSelected')}</SelectItem>
                    {accounts
                      .filter(account => account.id !== (accountId || Number(formData.accountId)))
                      .map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="attachToTransactionId" className="block text-sm font-medium mb-2">
                  {t('newTransaction.attachToTransaction')} ({t('newTransaction.optional')})
                </label>
                <SearchableSelect
                  value={formData.attachToTransactionId}
                  onChange={(value) => setFormData(prev => ({ ...prev, attachToTransactionId: value }))}
                  disabled={availableTransactions.length === 0 || searchingTransactions}
                  placeholder={
                    searchingTransactions 
                      ? t('newTransaction.searchingTransactions')
                      : availableTransactions.length === 0 
                      ? t('newTransaction.selectAccountFirst') 
                      : t('newTransaction.selectTransactionToAttach')
                  }
                  searchPlaceholder={t('newTransaction.searchTransactions')}
                  noOptionsText={t('newTransaction.noTransactionsMatch')}
                  options={[
                    { value: 'none', label: t('newTransaction.noAttachment') },
                    ...availableTransactions.map(tx => ({
                      value: tx.id.toString(),
                      label: `${tx.description || t('newTransaction.noDescription')}`,
                      sublabel: `${tx.account.name} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)} - ${new Date(tx.date).toLocaleDateString()}`
                    }))
                  ]}
                />
                {availableTransactions.length === 0 && selectedSearchAccountId && selectedSearchAccountId !== 'none' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('newTransaction.noTransactionsFound')}
                  </p>
                )}
              </div>
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