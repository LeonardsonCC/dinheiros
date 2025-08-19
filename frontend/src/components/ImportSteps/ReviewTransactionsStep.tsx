import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import TransactionReviewTable from '../TransactionReviewTable';

interface Transaction {
  id?: number;
  description: string;
  amount: number;
  date: string;
  type: string;
  categoryIds: number[];
  accountId: string;
  ignore?: boolean;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface ReviewTransactionsStepProps {
  transactions: Transaction[];
  categories: Category[];
  saveLoading: boolean;
  onTransactionChange: (index: number, field: string, value: any) => void;
  onToggleIgnore: (index: number) => void;
  onToggleAll: (ignore: boolean) => void;
  onAddCategory: (name: string, type: string) => Promise<{ id: number; name: string; type: string }>;
  onCategoryAdded: (category: { id: number; name: string; type: string }, index: number) => void;
  onCreateCategorizationRule: (description: string, type: string, categoryIds: number[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ReviewTransactionsStep({
  transactions,
  categories,
  saveLoading,
  onTransactionChange,
  onToggleIgnore,
  onToggleAll,
  onAddCategory,
  onCategoryAdded,
  onCreateCategorizationRule,
  onSave,
  onCancel
}: ReviewTransactionsStepProps) {
  const { t } = useTranslation();

  const transactionsToImport = transactions.filter(tx => !tx.ignore);
  const transactionsToIgnore = transactions.filter(tx => tx.ignore);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>
              ✓ {transactionsToImport.length} {t('importTransactions.toImport', 'to import')}
            </span>
            {transactionsToIgnore.length > 0 && (
              <span>
                ⚠ {transactionsToIgnore.length} {t('importTransactions.toIgnore', 'to ignore')}
              </span>
            )}
          </div>
        </div>
      </div>

      <TransactionReviewTable
        transactions={transactions}
        categories={categories}
        onTransactionChange={onTransactionChange}
        onToggleIgnore={onToggleIgnore}
        onToggleAll={onToggleAll}
        onAddCategory={onAddCategory}
        onCategoryAdded={onCategoryAdded}
        onCreateCategorizationRule={onCreateCategorizationRule}
      />

      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saveLoading}
        >
          {t('importTransactions.cancel')}
        </Button>

        <div className="flex space-x-3">
          <div className="text-sm text-muted-foreground self-center">
            {transactionsToImport.length > 0
              ? `${transactionsToImport.length} ${t('importTransactions.transactionsReady', 'transactions ready to import')}`
              : t('importTransactions.noTransactionsToImport', 'No transactions to import')
            }
          </div>

          <Button
            onClick={onSave}
            disabled={saveLoading || transactionsToImport.length === 0}
            size="lg"
          >
            {saveLoading
              ? t('importTransactions.importing')
              : `${t('importTransactions.import')} ${transactionsToImport.length} ${t('importTransactions.transactions', 'transactions')}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
