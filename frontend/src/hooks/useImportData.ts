import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { TransactionDraft } from '@/components/ImportSteps/types';

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Extractor {
  name: string;
  displayName: string;
}

interface UseImportDataReturn {
  accounts: Account[];
  accountsLoading: boolean;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  extractors: Extractor[];
  getFilteredCategories: (type: string) => Category[];
  handleAddCategory: (name: string, type: string, transactionIndex?: number) => Promise<Category | null>;
}

export const useImportData = (
  urlAccountId?: string,
  transactions?: TransactionDraft[],
  setTransactions?: React.Dispatch<React.SetStateAction<TransactionDraft[]>>
): UseImportDataReturn => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [extractors, setExtractors] = useState<Extractor[]>([]);

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

  useEffect(() => {
    api.get(`/api/accounts/transactions/extractors`)
      .then((res) => setExtractors(res.data.extractors || []))
      .catch(() => toast.error('Failed to load extractors'));
  }, []);

  const getFilteredCategories = (type: string) => {
    return categories.filter(cat => !type || cat.type === type);
  };

  const handleAddCategory = async (name: string, type: string, transactionIndex?: number): Promise<Category | null> => {
    try {
      const res = await api.post('/api/categories', { name, type });
      const rawCategory = res.data;
      const newCategory = {
        id: Number(rawCategory.ID || rawCategory.id),
        name: String(rawCategory.Name || rawCategory.name),
        type: String(rawCategory.Type || rawCategory.type)
      };
      setCategories(prev => [...prev, newCategory]);

      if (typeof transactionIndex === 'number' && transactions && setTransactions) {
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

  return {
    accounts,
    accountsLoading,
    categories,
    setCategories,
    extractors,
    getFilteredCategories,
    handleAddCategory,
  };
};
