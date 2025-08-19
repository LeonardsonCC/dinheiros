import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';
import ImportWizard from '../components/ImportWizard';
import { useTranslation } from 'react-i18next';
import { useFileUpload } from '../hooks/useFileUpload';
import { useTransactions } from '../hooks/useTransactions';
import { useImportTransactions } from '../hooks/useImportTransactions';
import { useImportData } from '../hooks/useImportData';
import { validateImportForm } from '../lib/importUtils';
import { categorizationRulesApi } from '../services/api';
import {
  AccountSelectionStep,
  ExtractorSelectionStep,
  FileUploadStep,
  ReviewTransactionsStep
} from '../components/ImportSteps';

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

  const handleProcessFile = async () => {
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

  if (accountsLoading) {
    return <Loading message={t('importTransactions.loading')} />;
  }

  // Build wizard steps
  const steps = [
    {
      id: 'account',
      title: t('importTransactions.selectAccount'),
      description: t('importTransactions.selectAccountDescription', 'Choose the account where you want to import transactions.'),
      component: (
        <AccountSelectionStep
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountSelect={setSelectedAccountId}
          loading={accountsLoading}
        />
      ),
      isValid: !!selectedAccountId
    },
    {
      id: 'extractor',
      title: t('importTransactions.selectExtractor', 'Select Extractor'),
      description: t('importTransactions.selectExtractorDescription', 'Choose the extractor that matches your file type.'),
      component: (
        <ExtractorSelectionStep
          extractors={extractors}
          selectedExtractor={selectedExtractor}
          onExtractorSelect={setSelectedExtractor}
        />
      ),
      isValid: !!selectedExtractor
    },
    {
      id: 'upload',
      title: t('importTransactions.uploadFile', 'Upload File'),
      description: t('importTransactions.fileUploadDescription', 'Upload a PDF file containing your transactions to extract and import them.'),
      component: (
        <FileUploadStep
          selectedFile={selectedFile}
          fileError={fileError}
          isLoading={isLoading}
          onFileSelect={setSelectedFile}
          onProcess={handleProcessFile}
          validateFile={validateFile}
        />
      ),
      isValid: transactions.length > 0
    },
    {
      id: 'review',
      title: t('importTransactions.reviewTransactions', 'Review Transactions'),
      description: t('importTransactions.reviewDescription', 'Review the extracted transactions before importing them.'),
      component: (
        <ReviewTransactionsStep
          transactions={transactions}
          categories={categories}
          saveLoading={saveLoading}
          onTransactionChange={handleTransactionChange}
          onToggleIgnore={toggleIgnoreTransaction}
          onToggleAll={toggleAllTransactions}
          onAddCategory={handleAddCategory}
          onCategoryAdded={handleCategoryAdded}
          onCreateCategorizationRule={handleCreateCategorizationRule}
          onSave={handleSaveTransactions}
          onCancel={() => setTransactions([])}
        />
      ),
      isValid: transactions.length > 0
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('importTransactions.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('importTransactions.wizardDescription', 'Follow the steps below to import transactions from your bank statements.')}
        </p>
      </div>
      
      <ImportWizard
        steps={steps}
        onBack={() => navigate(-1)}
        backText={`${t('importTransactions.back')} ${t('transactions.transactions')}`}
      />
    </div>
  );
}
