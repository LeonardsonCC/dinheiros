import { useTranslation } from 'react-i18next';

import { FileUpload } from '../ui/file-upload';

interface FileUploadStepProps {
  selectedFile: File | null;
  fileError: string;
  isLoading: boolean;
  onFileSelect: (file: File | null) => void;
  validateFile: (file: File) => boolean;
}

export default function FileUploadStep({
  selectedFile,
  fileError,
  isLoading,
  onFileSelect,
  validateFile
}: FileUploadStepProps) {
  const { t } = useTranslation();

  const handleFileSelect = (file: File | null) => {
    onFileSelect(file);
    if (file && validateFile(file)) {
      // File error will be cleared by validateFile
    }
  };



  return (
    <div className="space-y-4">
      <FileUpload
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        accept=".pdf"
        maxSize={10 * 1024 * 1024}
        error={fileError}
        uploadText={t('importTransactions.import')}
        dragText={t('importTransactions.orDrag')}
        sizeLimit={t('importTransactions.pdfLimit')}
        disabled={isLoading}
      />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>{t('importTransactions.supported')}</p>
        <p>
          {t('importTransactions.supportedFormats', 'Supported formats: Bank statements, credit card statements')}
        </p>
      </div>

      {selectedFile && !fileError && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✓ {t('importTransactions.fileSelected', 'File selected')}: {' '}
            <span className="font-medium">{selectedFile.name}</span>
            {' '}({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}


    </div>
  );
}
