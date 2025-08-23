import { Transaction } from "../TransactionsTable";

export interface TransactionDraft extends Transaction {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  categoryIds: number[];
  ignored: boolean
}
