import { useState, useCallback, useEffect, Fragment, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLongLeftIcon, DocumentTextIcon, XMarkIcon, ChevronUpDownIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import Loading from '../components/Loading';
import DatePicker from '../components/DatePicker';
import { useTranslation } from 'react-i18next';

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
  const [isDragging, setIsDragging] = useState(false);
  const [isValidFile, setIsValidFile] = useState(true);
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
      .then((res) => setCategories(res.data.categories || res.data))
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setIsValidFile(true);
      } else {
        setSelectedFile(null);
        setIsValidFile(false);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setIsValidFile(true);
      } else {
        setSelectedFile(null);
        setIsValidFile(false);
      }
    }
  };

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
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('importTransactions.selectAccount')}</h1>
        {accountsLoading ? (
          <p>{t('importTransactions.loading')}</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500">{t('importTransactions.noAccounts')}</p>
        ) : (
          <ul className="space-y-2">
            {accounts.map(acc => (
              <li key={acc.id}>
                <button
                  className="w-full text-left px-4 py-2 rounded bg-primary-100 hover:bg-primary-200 text-primary-800 font-medium"
                  onClick={() => setSelectedAccountId(acc.id)}
                >
                  {acc.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => navigate(-1)}
          className="mt-6 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" /> {t('importTransactions.back')}
        </button>
      </div>
    );
  }

  // MultiSelectDropdown for categories (inline, for table usage)
  function CategoryMultiSelectDropdown({
    options,
    selected,
    onChange,
    disabled,
    placeholder = t('importTransactions.selectCategories'),
    onAddCategory,
  }: {
    options: { id: number; name: string }[];
    selected: number[];
    onChange: (selected: number[]) => void;
    disabled?: boolean;
    placeholder?: string;
    onAddCategory?: (name: string) => void;
  }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (optionId: number) => {
      if (disabled) return;
      const newSelected = selected.includes(optionId)
        ? selected.filter(id => id !== optionId)
        : [...selected, optionId];
      onChange(newSelected);
    };

    const handleAddCategory = () => {
      if (onAddCategory && newCategory.trim()) {
        onAddCategory(newCategory.trim());
        setNewCategory('');
        setSearchTerm('');
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className={`w-full border rounded px-1 py-0.5 text-left bg-white h-10 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && setIsOpen(v => !v)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selected.map(id => {
                const option = options.find(opt => opt.id === id);
                return (
                  <span key={id} className="inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                    {option?.name}
                    <XMarkIcon
                      className="ml-1 h-3 w-3 text-indigo-500 hover:text-indigo-700 cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        toggleOption(id);
                      }}
                    />
                  </span>
                );
              })
            )}
          </div>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
          </span>
        </button>
        <Transition
          show={isOpen}
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-xs">
            <div className="p-2">
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                placeholder={t('importTransactions.searchOrAddCategory')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
            {filteredOptions.length === 0 && searchTerm.trim() ? (
              <div className="px-3 py-2 text-gray-500 flex items-center justify-between">
                <span>{t('importTransactions.noMatchAdd', { name: searchTerm })}</span>
                {onAddCategory && (
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-xs"
                    onClick={() => { setNewCategory(searchTerm); handleAddCategory(); setIsOpen(false); }}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> {t('importTransactions.add')}
                  </button>
                )}
              </div>
            ) : null}
            {filteredOptions.map(option => (
              <div
                key={option.id}
                className={`cursor-pointer px-3 py-2 hover:bg-indigo-50 flex items-center ${selected.includes(option.id) ? 'font-semibold text-indigo-700' : ''}`}
                onClick={() => toggleOption(option.id)}
              >
                {option.name}
                {selected.includes(option.id) && (
                  <CheckIcon className="ml-2 h-4 w-4 text-indigo-600" />
                )}
              </div>
            ))}
          </div>
        </Transition>
      </div>
    );
  }

  // Add category creation logic
  const handleAddCategory = async (name: string, type: string) => {
    try {
      const res = await api.post('/api/categories', { name, type });
      setCategories(prev => [...prev, res.data]);
      toast.success('Category added!');
    } catch {
      toast.error('Failed to add category');
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
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
          {t('importTransactions.back')} {t('transactions.transactions')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('importTransactions.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('importTransactions.uploadPdf')}
        </p>
      </div>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {transactions.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-2">{t('importTransactions.reviewEdit')}</h2>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{t('transactionsTable.type.expense')}</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('transactionsTable.date')}</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('transactionsTable.description')}</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">{t('transactionsTable.amount')}</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('transactionsTable.categories')}</th>
                          <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 cursor-pointer select-none" onClick={() => {
                            const allIgnored = transactions.length > 0 && transactions.every(t => t.ignored);
                            setTransactions(prev => prev.map(t => ({ ...t, ignored: !allIgnored })));
                          }} title={t('importTransactions.toggleAll')}>{t('importTransactions.ignoreTransaction')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {transactions.map((tx, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50 ${tx.ignored ? 'opacity-40 line-through bg-gray-100' : ''}`}> 
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              <select
                                className="border rounded px-1 py-0.5 w-full"
                                value={typeof tx.type === 'string' ? tx.type : 'expense'}
                                onChange={e => handleTransactionChange(idx, 'type', e.target.value)}
                                disabled={!!tx.ignored}
                              >
                                <option value="expense">{t('transactionsTable.type.expense')}</option>
                                <option value="income">{t('transactionsTable.type.income')}</option>
                                <option value="transfer">{t('transactionsTable.type.transfer')}</option>
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <DatePicker
                                label=""
                                value={typeof tx.date === 'string' ? tx.date : ''}
                                onChange={value => handleTransactionChange(idx, 'date', value)}
                                className="border rounded px-1 py-0.5 w-full"
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <input
                                type="text"
                                className="border rounded px-1 py-0.5 w-full"
                                value={typeof tx.description === 'string' ? tx.description : ''}
                                onChange={e => handleTransactionChange(idx, 'description', e.target.value)}
                                disabled={!!tx.ignored}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                              <input
                                type="number"
                                className="border rounded px-1 py-0.5 w-full text-right"
                                value={typeof tx.amount === 'number' ? tx.amount : ''}
                                onChange={e => handleTransactionChange(idx, 'amount', parseFloat(e.target.value))}
                                disabled={!!tx.ignored}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <CategoryMultiSelectDropdown
                                  options={getFilteredCategories(typeof tx.type === 'string' ? tx.type : 'expense')}
                                  selected={Array.isArray(tx.categoryIds) ? tx.categoryIds : []}
                                  onChange={catIds => handleTransactionChange(idx, 'categoryIds', catIds)}
                                  disabled={!!tx.ignored}
                                  onAddCategory={name => handleAddCategory(name, typeof tx.type === 'string' ? tx.type : 'expense')}
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
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                              <button
                                type="button"
                                onClick={() => toggleIgnoreTransaction(idx)}
                                className={`text-gray-400 hover:text-red-500 transition ${tx.ignored ? 'opacity-100' : ''}`}
                                title={tx.ignored ? t('importTransactions.restoreTransaction') : t('importTransactions.ignoreTransaction')}
                              >
                                <XMarkIcon className="h-5 w-5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setTransactions([])}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('importTransactions.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransactions}
                  disabled={saveLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {saveLoading ? t('importTransactions.importing') : t('importTransactions.save')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Extractor selection */}
              <div className="mb-4">
                <label htmlFor="extractor-select" className="block text-sm font-medium text-gray-700">
                  {t('importTransactions.extractor')}
                </label>
                <select
                  id="extractor-select"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={selectedExtractor}
                  onChange={e => setSelectedExtractor(e.target.value)}
                  disabled={extractors.length === 0}
                >
                  <option value="">{t('importTransactions.selectExtractor')}</option>
                  {extractors.map(ext => (
                    <option key={ext.name} value={ext.name}>{ext.displayName}</option>
                  ))}
                </select>
              </div>
              {!urlAccountId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('importTransactions.selectAccount')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    disabled={accountsLoading}
                    required
                  >
                    <option value="">{t('importTransactions.selectAccountOption')}</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('importTransactions.file')}
                  <span className="text-red-500">*</span>
                </label>
                
                {!selectedFile ? (
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                      isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    } ${!isValidFile ? 'border-red-500' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-1 text-center">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                        >
                          <span>{t('importTransactions.import')}</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">{t('importTransactions.orDrag')}</p>
                      </div>
                      <p className="text-xs text-gray-500">{t('importTransactions.pdfLimit')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {selectedFile.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      <span className="sr-only">{t('importTransactions.removeFile')}</span>
                    </button>
                  </div>
                )}
                
                {fileError && (
                  <p className="mt-2 text-sm text-red-600">{fileError}</p>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  {t('importTransactions.supported')}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('importTransactions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    isLoading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? t('importTransactions.importing') : t('importTransactions.import')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
