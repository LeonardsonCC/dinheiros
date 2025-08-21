import { Transaction } from "../TransactionsTable";

export interface TransactionDraft extends Transaction {
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  date: string;
  categoryIds: number[];
  ignored: boolean
}
