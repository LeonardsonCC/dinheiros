export const validateImportFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file.type.includes('pdf')) {
    return { isValid: false, error: 'Only PDF files are allowed' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'File is too large. Maximum size is 10MB' };
  }

  return { isValid: true };
};

export const validateImportForm = (
  selectedFile: File | null,
  accountId: string
): { isValid: boolean; error?: string } => {
  if (!selectedFile) {
    return { isValid: false, error: 'Please select a file to upload' };
  }

  if (!accountId) {
    return { isValid: false, error: 'Please select an account' };
  }

  const fileValidation = validateImportFile(selectedFile);
  if (!fileValidation.isValid) {
    return fileValidation;
  }

  return { isValid: true };
};

interface TransactionDraft {
  [key: string]: unknown;
}

interface RawTransaction {
  [key: string]: unknown;
  date?: string;
  categories?: Array<{ ID: number | string }>;
}

export const transformTransactionData = (rawTransactions: RawTransaction[]): TransactionDraft[] => {
  return rawTransactions.map((t: RawTransaction) => ({
    ...t,
    date: t.date ? new Date(t.date as string).toISOString().slice(0, 10) : '',
    categoryIds: Array.isArray(t.categories)
      ? (t.categories as Array<{ ID: number | string }>).map(cat => Number(cat.ID))
      : [],
    categories: undefined,
  }));
};