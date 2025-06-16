import { useTranslation } from 'react-i18next';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FileUpload,
} from './ui';

interface Account {
  id: string;
  name: string;
}

interface Extractor {
  name: string;
  displayName: string;
}

interface FileUploadFormProps {
  selectedFile: File | null;
  fileError: string;
  accounts: Account[];
  accountsLoading: boolean;
  extractors: Extractor[];
  selectedAccountId: string;
  selectedExtractor: string;
  urlAccountId?: string;
  isLoading: boolean;
  onFileSelect: (file: File | null) => void;
  onAccountSelect: (accountId: string) => void;
  onExtractorSelect: (extractor: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  validateFile: (file: File) => boolean;
}

export default function FileUploadForm({
  selectedFile,
  fileError,
  accounts,
  accountsLoading,
  extractors,
  selectedAccountId,
  selectedExtractor,
  urlAccountId,
  isLoading,
  onFileSelect,
  onAccountSelect,
  onExtractorSelect,
  onSubmit,
  onCancel,
  validateFile,
}: FileUploadFormProps) {
  const { t } = useTranslation();

  const handleFileSelect = (file: File | null) => {
    onFileSelect(file);
    if (file && validateFile(file)) {
      // File error will be cleared by validateFile
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="extractor-select" className="text-sm font-medium">
          {t('importTransactions.extractor')}
        </label>
        <Select
          value={selectedExtractor}
          onValueChange={onExtractorSelect}
          disabled={extractors.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('importTransactions.selectExtractor')} />
          </SelectTrigger>
          <SelectContent>
            {extractors.map(ext => (
              <SelectItem key={ext.name} value={ext.name}>{ext.displayName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {!urlAccountId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('importTransactions.selectAccount')} <span className="text-destructive">*</span>
          </label>
          <Select
            value={selectedAccountId}
            onValueChange={onAccountSelect}
            disabled={accountsLoading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={t('importTransactions.selectAccountOption')} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t('importTransactions.file')}
          <span className="text-destructive">*</span>
        </label>

        <FileUpload
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          accept=".pdf"
          maxSize={10 * 1024 * 1024}
          error={fileError}
          uploadText={t('importTransactions.import')}
          dragText={t('importTransactions.orDrag')}
          sizeLimit={t('importTransactions.pdfLimit')}
        />

        <p className="text-xs text-muted-foreground">
          {t('importTransactions.supported')}
        </p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {t('importTransactions.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? t('importTransactions.importing') : t('importTransactions.import')}
        </Button>
      </div>
    </form>
  );
}