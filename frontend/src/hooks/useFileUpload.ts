import { useState, useCallback } from 'react';

interface UseFileUploadReturn {
  selectedFile: File | null;
  fileError: string;
  setSelectedFile: (file: File | null) => void;
  setFileError: (error: string) => void;
  validateFile: (file: File) => boolean;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const validateFile = useCallback((file: File): boolean => {
    if (!file.type.includes('pdf')) {
      setFileError('Only PDF files are allowed');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File is too large. Maximum size is 10MB');
      return false;
    }

    setFileError('');
    return true;
  }, []);

  return {
    selectedFile,
    fileError,
    setSelectedFile,
    setFileError,
    validateFile,
  };
};