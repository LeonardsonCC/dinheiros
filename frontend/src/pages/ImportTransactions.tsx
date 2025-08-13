import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';
import TransactionReviewTable from '../components/TransactionReviewTable';
import FileUploadForm from '../components/FileUploadForm';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  AccountSelector
} from '../components/ui';
import { useFileUpload } from '../hooks/useFileUpload';
import { useTransactions } from '../hooks/useTransactions';
import { useImportTransactions } from '../hooks/useImportTransactions';
import { useImportData } from '../hooks/useImportData';
import { validateImportForm } from '../lib/importUtils';
import { categorizationRulesApi } from '../services/api';

export default function ImportTransactions() {
  const { t } = useTranslation();
  const { accountId: urlAccountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(urlAccountId || '');
  const [selectedExtractor, setSelectedExtractor] = useState<string>('');

  const { selectedFile, fileError, setSelectedFile, setFileError, validateFile } = useFileUpload();
  const { 
    transactions, 
    setTransactions, 
    handleTransactionChange, 
    toggleIgnoreTransaction, 
    toggleAllTransactions 
  } = useTransactions();
  const { isLoading, saveLoading, importTransactions, saveTransactions } = useImportTransactions();
  const { 
    accounts, 
    accountsLoading, 
    categories, 
    setCategories, 
    extractors, 
    handleAddCategory 
  } = useImportData(urlAccountId, transactions, setTransactions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accountId = selectedAccountId;
    
    const validation = validateImportForm(selectedFile, accountId);
    if (!validation.isValid) {
      toast.error(validation.error!);
      if (validation.error?.includes('file')) {
        setFileError(validation.error);
      }
      return;
    }

    try {
      const importedTransactions = await importTransactions(
        selectedFile!,
        accountId,
        selectedExtractor
      );
      setTransactions(importedTransactions);
    } catch (error) {
      if (error instanceof Error) {
        setFileError(error.message);
      }
    }
  };

  const handleSaveTransactions = async () => {
    if (!selectedAccountId || transactions.length === 0) return;
    try {
      await saveTransactions(transactions, selectedAccountId);
    } catch (error) {
      // Error handling is done in the hook
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

  const handleCreateCategorizationRule = async (description: string, type: string, categoryIds: number[]) => {
    if (!description || categoryIds.length === 0) {
      toast.error(t('importTransactions.ruleCreateFailed'));
      return;
    }

    try {
      await categorizationRulesApi.create({
        name: `Auto-rule for: ${description}`,
        type: 'exact',
        value: description,
        transaction_type: type,
        category_dst: categoryIds[0],
        active: true
      });

      let appliedCount = 0;
      setTransactions(prev => prev.map(tx => {
        if (typeof tx.description === 'string' && tx.description === description && 
            typeof tx.type === 'string' && tx.type === type) {
          appliedCount++;
          return { ...tx, categoryIds: categoryIds };
        }
        return tx;
      }));

      toast.success(`${t('importTransactions.ruleCreated')} (${appliedCount} ${appliedCount === 1 ? 'transaction' : 'transactions'})`);
    } catch (error) {
      console.error('Failed to create categorization rule:', error);
      toast.error(t('importTransactions.ruleCreateFailed'));
    }
  };

  if (isLoading || accountsLoading) {
    return <Loading message={t('importTransactions.loading')} />;
  }

  if (!urlAccountId && !selectedAccountId) {
    return (
      <AccountSelector
        accounts={accounts}
        onAccountSelect={setSelectedAccountId}
        onBack={() => navigate(-1)}
        title={t('importTransactions.selectAccount')}
        loading={accountsLoading}
        emptyMessage={t('importTransactions.noAccounts')}
        backText={t('importTransactions.back')}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('importTransactions.back')} {t('transactions.transactions')}
        </Button>
        <h1 className="text-2xl font-bold">{t('importTransactions.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('importTransactions.uploadPdf')}
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          {transactions.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-4">{t('importTransactions.reviewEdit')}</h2>
              <TransactionReviewTable
                transactions={transactions}
                categories={categories}
                onTransactionChange={handleTransactionChange}
                onToggleIgnore={toggleIgnoreTransaction}
                onToggleAll={toggleAllTransactions}
                onAddCategory={handleAddCategory}
                onCategoryAdded={handleCategoryAdded}
                onCreateCategorizationRule={handleCreateCategorizationRule}
              />
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setTransactions([])}
                >
                  {t('importTransactions.cancel')}
                </Button>
                <Button
                  onClick={handleSaveTransactions}
                  disabled={saveLoading}
                >
                  {saveLoading ? t('importTransactions.importing') : t('importTransactions.save')}
                </Button>
              </div>
            </div>
          ) : (
            <FileUploadForm
              selectedFile={selectedFile}
              fileError={fileError}
              accounts={accounts}
              accountsLoading={accountsLoading}
              extractors={extractors}
              selectedAccountId={selectedAccountId}
              selectedExtractor={selectedExtractor}
              urlAccountId={urlAccountId}
              isLoading={isLoading}
              onFileSelect={setSelectedFile}
              onAccountSelect={setSelectedAccountId}
              onExtractorSelect={setSelectedExtractor}
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
              validateFile={validateFile}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
