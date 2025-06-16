import { useState } from 'react';

interface TransactionDraft {
  [key: string]: unknown;
}

interface UseTransactionsReturn {
  transactions: TransactionDraft[];
  setTransactions: React.Dispatch<React.SetStateAction<TransactionDraft[]>>;
  handleTransactionChange: (idx: number, field: string, value: unknown) => void;
  toggleIgnoreTransaction: (idx: number) => void;
  toggleAllTransactions: () => void;
}

export const useTransactions = (): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<TransactionDraft[]>([]);

  const handleTransactionChange = (idx: number, field: string, value: unknown) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const toggleIgnoreTransaction = (idx: number) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, ignored: !t.ignored } : t));
  };

  const toggleAllTransactions = () => {
    const allIgnored = transactions.length > 0 && transactions.every(t => t.ignored);
    setTransactions(prev => prev.map(t => ({ ...t, ignored: !allIgnored })));
  };

  return {
    transactions,
    setTransactions,
    handleTransactionChange,
    toggleIgnoreTransaction,
    toggleAllTransactions,
  };
};