import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  date: string;
  categories: Category[];
  account: Account;
  toAccount?: Account;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  pagination: PaginationState;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSort: (key: keyof Transaction) => void;
  getSortIndicator: (key: keyof Transaction) => React.ReactNode;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  renderActions?: (transaction: Transaction) => React.ReactNode; // Optional actions column
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  getSortIndicator,
  formatCurrency,
  formatDate,
  renderActions,
}) => {
  const { t } = useTranslation();
  
  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('date')}
              >
                <div className="flex items-center">
                  {t('transactionsTable.date')}
                  <span className="ml-1">{getSortIndicator('date')}</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('description')}
              >
                <div className="flex items-center">
                  {t('transactionsTable.description')}
                  <span className="ml-1">{getSortIndicator('description')}</span>
                </div>
              </TableHead>
              <TableHead>{t('transactionsTable.account')}</TableHead>
              <TableHead>{t('transactionsTable.categories')}</TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('amount')}
              >
                <div className="flex justify-end items-center">
                  {t('transactionsTable.amount')}
                  <span className="ml-1">{getSortIndicator('amount')}</span>
                </div>
              </TableHead>
              {renderActions && (
                <TableHead className="text-center">
                  {t('transactionsTable.actions')}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 || loading ? (
              <TableRow>
                <TableCell colSpan={renderActions ? 6 : 5} className="text-center text-muted-foreground">
                  {loading ? t('transactionsTable.loading') : t('transactionsTable.noTransactions')}
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{transaction.description || t('transactionsTable.noDescription')}</div>
                    <div className="text-sm text-muted-foreground capitalize">{t(`transactionsTable.type.${transaction.type}`)}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.account?.name || t('transactionsTable.na')}
                    {transaction.toAccount && (
                      <span className="text-muted-foreground/70"> → {transaction.toAccount.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {transaction.categories.length > 0 ? (
                        transaction.categories.map((category) => (
                          <Badge key={category.id} variant="secondary">
                            {category.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('transactionsTable.na')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getAmountColor(transaction.type)}`}>
                    {transaction.type === 'expense' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  {renderActions && (
                    <TableCell className="text-center">
                      {renderActions(transaction)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {t('transactionsTable.showing', {
                from: (pagination.currentPage - 1) * pagination.pageSize + 1,
                to: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems),
                total: pagination.totalItems
              })}
            </p>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">{t('transactionsTable.size')}</p>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => onPageSizeChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                {t('transactionsTable.page')} {pagination.currentPage} {t('transactionsTable.of')} {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
