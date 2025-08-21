import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { TransactionDraft } from './types';

interface ExistingTransaction {
  id: number;
  date: string;
  amount: number;
  description?: string;
  type?: string;
}

interface ConflictTransaction extends TransactionDraft {
  conflictsWith?: ExistingTransaction[];
  resolution?: 'keep_existing' | 'keep_both';
}

interface ConferenceStepProps {
  transactions: TransactionDraft[];
  accountId: string;
  onTransactionsUpdate: (transactions: TransactionDraft[]) => void;
}

export interface ConferenceStepRef {
  handleProceed: () => void;
}

const ConferenceStep = forwardRef<ConferenceStepRef, ConferenceStepProps>(({
  transactions,
  accountId,
  onTransactionsUpdate
}, ref) => {
  const { t } = useTranslation();
  const [existingTransactions, setExistingTransactions] = useState<ExistingTransaction[]>([]);
  const [conflictTransactions, setConflictTransactions] = useState<ConflictTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExistingTransactions = async () => {
      if (!accountId) return;

      try {
        setIsLoading(true);
        // TODO: seriously claude? Get all the transactions to frontend and process here??
        const response = await api.get(`/api/accounts/${accountId}/transactions`);
        setExistingTransactions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch existing transactions:', error);
        toast.error(t('importTransactions.conference.fetchError', 'Failed to fetch existing transactions'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingTransactions();
  }, [accountId, t]);

  useEffect(() => {
    if (existingTransactions.length === 0) return;

    const conflicts: ConflictTransaction[] = transactions.map(newTx => {
      const potentialConflicts = existingTransactions.filter(existingTx => {
        const sameDate = new Date(newTx.date).toDateString() === new Date(existingTx.date).toDateString();
        const sameAmount = Math.abs(newTx.amount - existingTx.amount) < 0.01; // Allow small floating point differences
        return sameDate && sameAmount;
      });

      return {
        ...newTx,
        conflictsWith: potentialConflicts,
        resolution: potentialConflicts.length > 0 ? 'keep_existing' : undefined
      };
    });

    setConflictTransactions(conflicts);
  }, [transactions, existingTransactions]);

  const handleResolutionChange = (index: number, resolution: 'keep_existing' | 'keep_both') => {
    setConflictTransactions(prev => prev.map((tx, i) =>
      i === index ? { ...tx, resolution } : tx
    ));
  };

  const handleProceed = () => {
    const finalTransactions = conflictTransactions
      // .filter(tx => tx.resolution === 'keep_both' || !tx.conflictsWith?.length)
      .map(tx => {
        const { conflictsWith, resolution, ...cleanTx } = tx;
        cleanTx.ignored = (conflictsWith && resolution == 'keep_existing') || false;
        return cleanTx;
      });

    onTransactionsUpdate(finalTransactions);
  };

  useImperativeHandle(ref, () => ({
    handleProceed
  }));

  const conflictsCount = conflictTransactions.filter(tx => tx.conflictsWith && tx.conflictsWith.length > 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          {t('importTransactions.conference.loading', 'Checking for duplicate transactions...')}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          {t('importTransactions.conference.title', 'Duplicate Transaction Check')}
        </h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          {conflictsCount > 0
            ? t('importTransactions.conference.conflictsFound',
              `Found ${conflictsCount} potential duplicate transaction(s). Please review and choose which transactions to keep.`,
              { count: conflictsCount })
            : t('importTransactions.conference.noConflicts', 'No duplicate transactions found. All transactions are ready to import.')
          }
        </p>
      </div>

      {conflictsCount > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            {t('importTransactions.conference.reviewConflicts', 'Review Conflicts')}
          </h4>

          {conflictTransactions.map((transaction, index) => {
            if (!transaction.conflictsWith || transaction.conflictsWith.length === 0) return null;

            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {t('importTransactions.conference.conflictDetected', 'Duplicate Detected')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* New Transaction */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {t('importTransactions.conference.newTransaction', 'New Transaction')}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">{t('importTransactions.conference.date', 'Date')}:</span>
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">{t('importTransactions.conference.amount', 'Amount')}:</span>
                            <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">{t('importTransactions.conference.description', 'Description')}:</span>
                            <span className="text-right max-w-32 truncate" title={transaction.description || t('importTransactions.conference.notAvailable', 'N/A')}>
                              {transaction.description || t('importTransactions.conference.notAvailable', 'N/A')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">{t('importTransactions.conference.type', 'Type')}:</span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.type || t('importTransactions.conference.notAvailable', 'N/A')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Transaction */}
                    <Card className="border-l-4 border-l-amber-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {t('importTransactions.conference.existingTransaction', 'Existing Transaction')}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {transaction.conflictsWith.map((existing, idx) => (
                          <div key={idx} className="space-y-2 text-sm mb-4 last:mb-0">
                            <div className="flex justify-between">
                              <span className="font-medium text-muted-foreground">{t('importTransactions.conference.date', 'Date')}:</span>
                              <span>{formatDate(existing.date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-muted-foreground">{t('importTransactions.conference.amount', 'Amount')}:</span>
                              <span className="font-semibold">{formatCurrency(existing.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-muted-foreground">{t('importTransactions.conference.description', 'Description')}:</span>
                              <span className="text-right max-w-32 truncate" title={existing.description || t('importTransactions.conference.notAvailable', 'N/A')}>
                                {existing.description || t('importTransactions.conference.notAvailable', 'N/A')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-muted-foreground">{t('importTransactions.conference.type', 'Type')}:</span>
                              <Badge variant="outline" className="text-xs">
                                {existing.type || t('importTransactions.conference.notAvailable', 'N/A')}
                              </Badge>
                            </div>
                            {transaction.conflictsWith && idx < transaction.conflictsWith.length - 1 && <hr className="my-3" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      {t('importTransactions.conference.chooseAction', 'Choose Action:')}
                    </h4>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Keep Existing Option */}
                      <div
                        className={cn(
                          "relative flex cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50",
                          transaction.resolution === 'keep_existing'
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                            : "border-muted"
                        )}
                        onClick={() => handleResolutionChange(index, 'keep_existing')}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name={`resolution-${index}`}
                            value="keep_existing"
                            checked={transaction.resolution === 'keep_existing'}
                            onChange={() => handleResolutionChange(index, 'keep_existing')}
                            className="mt-1 h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                                {t('importTransactions.conference.existing', 'Existing')}
                              </Badge>
                              <span className="font-medium text-sm">
                                {t('importTransactions.conference.keepExisting', 'Keep existing transaction (skip new)')}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t('importTransactions.conference.keepExistingDesc', 'Skip importing the new transaction and keep the existing one')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Keep Both Option */}
                      <div
                        className={cn(
                          "relative flex cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50",
                          transaction.resolution === 'keep_both'
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            : "border-muted"
                        )}
                        onClick={() => handleResolutionChange(index, 'keep_both')}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name={`resolution-${index}`}
                            value="keep_both"
                            checked={transaction.resolution === 'keep_both'}
                            onChange={() => handleResolutionChange(index, 'keep_both')}
                            className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-300 text-xs">
                                {t('importTransactions.conference.both', 'Both')}
                              </Badge>
                              <span className="font-medium text-sm">
                                {t('importTransactions.conference.keepBoth', 'Keep both transactions')}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t('importTransactions.conference.keepBothDesc', 'Import the new transaction alongside the existing one')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


    </div>
  );
});

ConferenceStep.displayName = 'ConferenceStep';

export default ConferenceStep;
