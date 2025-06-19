import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLongLeftIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function ImportTransactions() {
  const { accountId: urlAccountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidFile, setIsValidFile] = useState(true);
  const [fileError, setFileError] = useState('');
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(urlAccountId || '');
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Fetch accounts if accountId is not in URL
  useEffect(() => {
    if (!urlAccountId) {
      setAccountsLoading(true);
      api.get('/api/accounts')
        .then((res) => {
          setAccounts(res.data.accounts || []);
        })
        .catch(() => {
          toast.error('Failed to load accounts');
        })
        .finally(() => setAccountsLoading(false));
    }
  }, [urlAccountId]);

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!file.type.includes('pdf')) {
      setFileError('Only PDF files are allowed');
      return false;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File is too large. Maximum size is 10MB');
      return false;
    }

    setFileError('');
    return true;
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setIsValidFile(true);
      } else {
        setSelectedFile(null);
        setIsValidFile(false);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setIsValidFile(true);
      } else {
        setSelectedFile(null);
        setIsValidFile(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use selectedAccountId instead of accountId
    const accountId = selectedAccountId;
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    // Validate file again before upload
    if (!validateFile(selectedFile)) {
      toast.error('Invalid file. Please check the file requirements.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('accountId', accountId);

    try {
      setIsLoading(true);
      const response = await api.post(`/api/accounts/${accountId}/transactions/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // You can add a progress bar here if needed
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log(`Upload progress: ${progress}%`);
        },
      });

      toast.success(`Successfully imported ${response.data.transactions_imported} transactions`);
      navigate(`/accounts/${accountId}/transactions`);
    } catch (error: unknown) {
        let errorMessage = 'Failed to import transactions';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as AxiosError;
          if (typeof err.response?.data?.error === 'string') {
            errorMessage = err.response.data.error;
          }
        }
        console.error('Error importing transactions:', error);
        toast.error(errorMessage);
        setFileError(errorMessage);
      } finally {
      setIsLoading(false);
    }
  };

  // Dedicated account selection page if no accountId in URL and none selected
  if (!urlAccountId && !selectedAccountId) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Select an Account</h1>
        {accountsLoading ? (
          <p>Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500">No accounts found.</p>
        ) : (
          <ul className="space-y-2">
            {accounts.map(acc => (
              <li key={acc.id}>
                <button
                  className="w-full text-left px-4 py-2 rounded bg-primary-100 hover:bg-primary-200 text-primary-800 font-medium"
                  onClick={() => setSelectedAccountId(acc.id)}
                >
                  {acc.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => navigate(-1)}
          className="mt-6 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
          Back to Transactions
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Import Transactions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload a PDF file containing transactions to import them into your account.
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!urlAccountId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Account <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  disabled={accountsLoading}
                  required
                >
                  <option value="">-- Select an account --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF File
                <span className="text-red-500">*</span>
              </label>
              
              {!selectedFile ? (
                <div 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  } ${!isValidFile ? 'border-red-500' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {selectedFile.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    <span className="sr-only">Remove file</span>
                  </button>
                </div>
              )}
              
              {fileError && (
                <p className="mt-2 text-sm text-red-600">{fileError}</p>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: .pdf
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  isLoading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Importing...' : 'Import Transactions'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
