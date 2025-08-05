import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import Loading from '../components/Loading';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  FileUpload,
  AccountSelector
} from '../components/ui';
import { CategoryMultiSelect } from '../components/ui/category-multi-select';
interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface TransactionDraft {
  [key: string]: unknown;
}

export default function ImportTransactions() {
  const { t } = useTranslation();
  const { accountId: urlAccountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [fileError, setFileError] = useState('');
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(urlAccountId || '');
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDraft[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [extractors, setExtractors] = useState<Array<{ name: string; displayName: string }>>([]);
  const [selectedExtractor, setSelectedExtractor] = useState<string>('');

  // Fetch accounts if accountId is not in URL
  useEffect(() => {
    if (!urlAccountId) {
      setAccountsLoading(true);
      api.get('/api/accounts')
        .then((res) => {
          setAccounts(res.data.accounts || []);
        })
        .catch(() => {
          toast.error('Failed to load accounts');
        })
        .finally(() => setAccountsLoading(false));
    }
  }, [urlAccountId]);

  // Fetch categories on mount
  useEffect(() => {
    api.get('/api/categories')
      .then((res) => {
        const cats = (res.data.categories || res.data).map((cat: Record<string, unknown>) => ({
          id: Number(cat.ID || cat.id),
          name: String(cat.Name || cat.name),
          type: String(cat.Type || cat.type)
        }));
        setCategories(cats);
      })
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  // Fetch extractors on mount or when account changes
  useEffect(() => {
    api.get(`/api/accounts/transactions/extractors`)
      .then((res) => setExtractors(res.data.extractors || []))
      .catch(() => toast.error('Failed to load extractors'));
  }, []);

  // Helper to get filtered categories by type
  const getFilteredCategories = (type: string) => {
    return categories.filter(cat => !type || cat.type === type);
  };

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!file.type.includes('pdf')) {
      setFileError('Only PDF files are allowed');
      return false;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File is too large. Maximum size is 10MB');
      return false;
    }

    setFileError('');
    return true;
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use selectedAccountId instead of accountId
    const accountId = selectedAccountId;
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    // Validate file again before upload
    if (!validateFile(selectedFile)) {
      toast.error('Invalid file. Please check the file requirements.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('accountId', accountId);
    if (selectedExtractor) {
      formData.append('extractor', selectedExtractor);
    }

    try {
      setIsLoading(true);
      const response = await api.post(`/api/accounts/${accountId}/transactions/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // You can add a progress bar here if needed
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log(`Upload progress: ${progress}%`);
        },
      });
      // Instead of redirecting, show transactions for review
      const txs = (response.data.transactions || []).map((t: Record<string, unknown>) => ({
        ...t,
        date: t.date ? new Date(t.date as string).toISOString().slice(0, 10) : '',
        // Convert categories array to categoryIds array for frontend compatibility
        categoryIds: Array.isArray(t.categories)
          ? (t.categories as Array<{ ID: number | string }>).map(cat => Number(cat.ID))
          : [],
        // Remove the categories array since we're using categoryIds
        categories: undefined,
      }));
      setTransactions(txs);
      toast.success(`Parsed ${txs.length} transactions. Review and save.`);
    } catch (error: unknown) {
      let errorMessage = 'Failed to import transactions';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.error === 'string') {
          errorMessage = err.response.data.error;
        }
      }
      console.error('Error importing transactions:', error);
      toast.error(errorMessage);
      setFileError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionChange = (idx: number, field: string, value: unknown) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  // Add a helper to toggle ignored state
  const toggleIgnoreTransaction = (idx: number) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, ignored: !t.ignored } : t));
  };

  const handleSaveTransactions = async () => {
    if (!selectedAccountId || transactions.length === 0) return;
    setSaveLoading(true);
    try {
      // Filter out ignored transactions
      const toSave = transactions.filter(t => !t.ignored);
      await api.post(`/api/accounts/${selectedAccountId}/transactions/bulk`, { transactions: toSave });
      toast.success('Transactions saved successfully!');
      navigate(`/accounts/${selectedAccountId}/transactions`);
    } catch (error) {
      toast.error('Failed to save transactions');
    } finally {
      setSaveLoading(false);
    }
  };

  if (isLoading || accountsLoading) {
    return <Loading message={t('importTransactions.loading')} />;
  }

  // Dedicated account selection page if no accountId in URL and none selected
  if (!urlAccountId && !selectedAccountId) {
    return (
      <AccountSelector
        accounts={accounts}
        onAccountSelect={setSelectedAccountId}
        onBack={() => navigate(-1)}
        title={t('importTransactions.selectAccount')}
        loading={accountsLoading}
        emptyMessage={t('importTransactions.noAccounts')}
        backText={t('importTransactions.back')}
      />
    );
  }



  // Add category creation logic
  const handleAddCategory = async (name: string, type: string, transactionIndex?: number) => {
    try {
      const res = await api.post('/api/categories', { name, type });
      const rawCategory = res.data;
      const newCategory = {
        id: Number(rawCategory.ID || rawCategory.id),
        name: String(rawCategory.Name || rawCategory.name),
        type: String(rawCategory.Type || rawCategory.type)
      };
      setCategories(prev => [...prev, newCategory]);

      // If transactionIndex is provided, add the category to that transaction
      if (typeof transactionIndex === 'number') {
        setTransactions(prev => prev.map((t, i) =>
          i === transactionIndex
            ? { ...t, categoryIds: [...(Array.isArray(t.categoryIds) ? t.categoryIds : []), newCategory.id] }
            : t
        ));
      }

      toast.success('Category added!');
      return newCategory;
    } catch {
      toast.error('Failed to add category');
      return null;
    }
  };

  const handleCategoryAdded = (cat: { id: number; name: string; type: string }, idx: number) => {
    setCategories(prev => [...prev, cat]);
    setTransactions(prev => prev.map((t, i) =>
      i === idx
        ? { ...t, categoryIds: [...(Array.isArray(t.categoryIds) ? t.categoryIds : []), cat.id] }
        : t
    ));
  };

  if (isLoading || accountsLoading) {
    return <Loading message={t('importTransactions.loading')} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('importTransactions.back')} {t('transactions.transactions')}
        </Button>
        <h1 className="text-2xl font-bold">{t('importTransactions.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('importTransactions.uploadPdf')}
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          {transactions.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-4">{t('importTransactions.reviewEdit')}</h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('transactionsTable.type.expense')}</TableHead>
                      <TableHead>{t('transactionsTable.date')}</TableHead>
                      <TableHead>{t('transactionsTable.description')}</TableHead>
                      <TableHead className="text-right">{t('transactionsTable.amount')}</TableHead>
                      <TableHead>{t('transactionsTable.categories')}</TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none"
                        onClick={() => {
                          const allIgnored = transactions.length > 0 && transactions.every(t => t.ignored);
                          setTransactions(prev => prev.map(t => ({ ...t, ignored: !allIgnored })));
                        }}
                        title={t('importTransactions.toggleAll')}
                      >
                        {t('importTransactions.ignoreTransaction')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, idx) => (
                      <TableRow
                        key={idx}
                        className={tx.ignored ? 'opacity-40 line-through bg-muted/50' : ''}
                      >
                        <TableCell>
                          <Select
                            value={typeof tx.type === 'string' ? tx.type : 'expense'}
                            onValueChange={value => handleTransactionChange(idx, 'type', value)}
                            disabled={!!tx.ignored}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">{t('transactionsTable.type.expense')}</SelectItem>
                              <SelectItem value="income">{t('transactionsTable.type.income')}</SelectItem>
                              <SelectItem value="transfer">{t('transactionsTable.type.transfer')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={typeof tx.date === 'string' ? tx.date : ''}
                            onChange={e => handleTransactionChange(idx, 'date', e.target.value)}
                            disabled={!!tx.ignored}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={typeof tx.description === 'string' ? tx.description : ''}
                            onChange={e => handleTransactionChange(idx, 'description', e.target.value)}
                            disabled={!!tx.ignored}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={typeof tx.amount === 'number' ? tx.amount : ''}
                            onChange={e => handleTransactionChange(idx, 'amount', parseFloat(e.target.value))}
                            disabled={!!tx.ignored}
                            className="w-full text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryMultiSelect
                              options={getFilteredCategories(typeof tx.type === 'string' ? tx.type : 'expense')}
                              selected={Array.isArray(tx.categoryIds) ? tx.categoryIds : []}
                              onChange={catIds => handleTransactionChange(idx, 'categoryIds', catIds)}
                              disabled={!!tx.ignored}
                              onAddCategory={name => handleAddCategory(name, typeof tx.type === 'string' ? tx.type : 'expense', idx)}
                              placeholder={t('importTransactions.selectCategories')}
                              searchPlaceholder={t('importTransactions.searchOrAddCategory')}
                              addText={t('importTransactions.add')}
                              noMatchText={t('importTransactions.noMatchAdd')}
                              className="flex-1"
                            />
                            <CategoryManager
                              initialType={
                                typeof tx.type === 'string' && (tx.type === 'expense' || tx.type === 'income' || tx.type === 'transfer')
                                  ? tx.type
                                  : 'expense'
                              }
                              onCategoryAdded={cat => handleCategoryAdded(cat, idx)}
                              buttonVariant="icon"
                              buttonClassName="ml-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleIgnoreTransaction(idx)}
                            className="text-muted-foreground hover:text-destructive"
                            title={tx.ignored ? t('importTransactions.restoreTransaction') : t('importTransactions.ignoreTransaction')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setTransactions([])}
                >
                  {t('importTransactions.cancel')}
                </Button>
                <Button
                  onClick={handleSaveTransactions}
                  disabled={saveLoading}
                >
                  {saveLoading ? t('importTransactions.importing') : t('importTransactions.save')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Extractor selection */}
              <div className="space-y-2">
                <label htmlFor="extractor-select" className="text-sm font-medium">
                  {t('importTransactions.extractor')}
                </label>
                <Select
                  value={selectedExtractor}
                  onValueChange={setSelectedExtractor}
                  disabled={extractors.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('importTransactions.selectExtractor')} />
                  </SelectTrigger>
                  <SelectContent>
                    {extractors.map(ext => (
                      <SelectItem key={ext.name} value={ext.name}>{ext.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!urlAccountId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('importTransactions.selectAccount')} <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                    disabled={accountsLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('importTransactions.selectAccountOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('importTransactions.file')}
                  <span className="text-destructive">*</span>
                </label>

                <FileUpload
                  selectedFile={selectedFile}
                  onFileSelect={(file) => {
                    setSelectedFile(file)
                    if (file && validateFile(file)) {
                      setFileError('')
                    }
                  }}
                  accept=".pdf"
                  maxSize={10 * 1024 * 1024}
                  error={fileError}
                  uploadText={t('importTransactions.import')}
                  dragText={t('importTransactions.orDrag')}
                  sizeLimit={t('importTransactions.pdfLimit')}
                />

                <p className="text-xs text-muted-foreground">
                  {t('importTransactions.supported')}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  {t('importTransactions.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                >
                  {isLoading ? t('importTransactions.importing') : t('importTransactions.import')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
