import { X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui';
import { CategoryMultiSelect } from './ui/category-multi-select';
import { MoneyInput } from './ui/money-input';
import CategoryManager from './CategoryManager';
import { TransactionDraft } from './ImportSteps/types';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface TransactionReviewTableProps {
  transactions: TransactionDraft[];
  categories: Category[];
  onTransactionChange: (idx: number, field: string, value: unknown) => void;
  onToggleIgnore: (idx: number) => void;
  onToggleAll: () => void;
  onAddCategory: (name: string, type: string, transactionIndex?: number) => Promise<Category | null>;
  onCategoryAdded: (cat: Category, idx: number) => void;
  onCreateCategorizationRule?: (description: string, type: string, categoryIds: number[]) => Promise<void>;
}

export default function TransactionReviewTable({
  transactions,
  categories,
  onTransactionChange,
  onToggleIgnore,
  onToggleAll,
  onAddCategory,
  onCategoryAdded,
  onCreateCategorizationRule,
}: TransactionReviewTableProps) {
  const { t } = useTranslation();

  const getFilteredCategories = (type: string) => {
    return categories.filter(cat => !type || cat.type === type);
  };

  const handleCreateRule = async (description: string, type: string, categoryIds: number[]) => {
    if (onCreateCategorizationRule && categoryIds.length > 0) {
      await onCreateCategorizationRule(description, type, categoryIds);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('transactionsTable.type.expense')}</TableHead>
            <TableHead>{t('transactionsTable.date')}</TableHead>
            <TableHead>{t('transactionsTable.description')}</TableHead>
            <TableHead className="text-right">{t('transactionsTable.amount')}</TableHead>
            <TableHead>{t('transactionsTable.categories')}</TableHead>
            <TableHead>{t('importTransactions.actions')}</TableHead>
            <TableHead
              className="text-center cursor-pointer select-none"
              onClick={onToggleAll}
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
                  onValueChange={value => onTransactionChange(idx, 'type', value)}
                  disabled={!!tx.ignored}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('transactionsTable.type.expense')}</SelectItem>
                    <SelectItem value="income">{t('transactionsTable.type.income')}</SelectItem>

                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={typeof tx.date === 'string' ? tx.date : ''}
                  onChange={e => onTransactionChange(idx, 'date', e.target.value)}
                  disabled={!!tx.ignored}
                  className="w-full"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={typeof tx.description === 'string' ? tx.description : ''}
                  onChange={e => onTransactionChange(idx, 'description', e.target.value)}
                  disabled={!!tx.ignored}
                  className="w-full"
                />
              </TableCell>
              <TableCell className="text-right">
                <MoneyInput
                  value={typeof tx.amount === 'number' ? tx.amount : 0}
                  onChange={(value) => onTransactionChange(idx, 'amount', value)}
                  disabled={!!tx.ignored}
                  className="w-full text-right"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CategoryMultiSelect
                    options={getFilteredCategories(typeof tx.type === 'string' ? tx.type : 'expense')}
                    selected={Array.isArray(tx.categoryIds) ? tx.categoryIds : []}
                    onChange={catIds => onTransactionChange(idx, 'categoryIds', catIds)}
                    disabled={!!tx.ignored}
                    onAddCategory={name => onAddCategory(name, typeof tx.type === 'string' ? tx.type : 'expense', idx)}
                    placeholder={t('importTransactions.selectCategories')}
                    searchPlaceholder={t('importTransactions.searchOrAddCategory')}
                    addText={t('importTransactions.add')}
                    noMatchText={t('importTransactions.noMatchAdd')}
                    className="flex-1"
                  />
                  <CategoryManager
                    initialType={
                      typeof tx.type === 'string' && (tx.type === 'expense' || tx.type === 'income')
                        ? tx.type
                        : 'expense'
                    }
                    onCategoryAdded={cat => onCategoryAdded(cat, idx)}
                    buttonVariant="icon"
                    buttonClassName="ml-1"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onCreateCategorizationRule && Array.isArray(tx.categoryIds) && tx.categoryIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateRule(
                        typeof tx.description === 'string' ? tx.description : '',
                        typeof tx.type === 'string' ? tx.type : 'expense',
                        Array.isArray(tx.categoryIds) ? tx.categoryIds : []
                      )}
                      disabled={!!tx.ignored}
                      title={t('importTransactions.createRule')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleIgnore(idx)}
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
  );
}
