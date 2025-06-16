import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

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

interface UseImportTransactionsReturn {
  isLoading: boolean;
  saveLoading: boolean;
  importTransactions: (
    selectedFile: File,
    accountId: string,
    selectedExtractor?: string
  ) => Promise<TransactionDraft[]>;
  saveTransactions: (transactions: TransactionDraft[], accountId: string) => Promise<void>;
}

export const useImportTransactions = (): UseImportTransactionsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const navigate = useNavigate();

  const importTransactions = async (
    selectedFile: File,
    accountId: string,
    selectedExtractor?: string
  ): Promise<TransactionDraft[]> => {
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
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log(`Upload progress: ${progress}%`);
        },
      });

      const txs = (response.data.transactions || []).map((t: Record<string, unknown>) => ({
        ...t,
        date: t.date ? new Date(t.date as string).toISOString().slice(0, 10) : '',
        categoryIds: Array.isArray(t.categories)
          ? (t.categories as Array<{ ID: number | string }>).map(cat => Number(cat.ID))
          : [],
        categories: undefined,
      }));

      toast.success(`Parsed ${txs.length} transactions. Review and save.`);
      return txs;
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
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTransactions = async (transactions: TransactionDraft[], accountId: string): Promise<void> => {
    if (!accountId || transactions.length === 0) return;
    
    setSaveLoading(true);
    try {
      const toSave = transactions.filter(t => !t.ignored);
      await api.post(`/api/accounts/${accountId}/transactions/bulk`, { transactions: toSave });
      toast.success('Transactions saved successfully!');
      navigate(`/accounts/${accountId}/transactions`);
    } catch (error) {
      toast.error('Failed to save transactions');
      throw error;
    } finally {
      setSaveLoading(false);
    }
  };

  return {
    isLoading,
    saveLoading,
    importTransactions,
    saveTransactions,
  };
};