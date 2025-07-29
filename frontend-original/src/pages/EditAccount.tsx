import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Loading from '../components/Loading';

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  color: string;
}

function isValidHexColor(color: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export default function EditAccount() {
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [color, setColor] = useState('#cccccc');
  const [colorError, setColorError] = useState('');
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setIsFetching(true);
        const response = await api.get(`/api/accounts/${accountId}`);
        const accountData = response.data;
        setAccount(accountData);
        setColor(accountData.color || '#cccccc');
      } catch (error: unknown) {
        let errorMessage = 'Failed to load account';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as AxiosError;
          if (typeof err.response?.data?.message === 'string') {
            errorMessage = err.response.data.message;
          }
        }
        console.error('Error fetching account:', error);
        toast.error(errorMessage);
        navigate('/accounts');
      } finally {
        setIsFetching(false);
      }
    };

    if (accountId) {
      fetchAccount();
    }
  }, [accountId, navigate]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const colorValue = formData.get('color') as string;
    if (!isValidHexColor(colorValue)) {
      setColorError('Please enter a valid hex color (e.g. #AABBCC)');
      return;
    }
    setColorError('');
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      color: colorValue
    };
    try {
      setIsLoading(true);
      await api.put(`/api/accounts/${accountId}`, data);
      toast.success('Account updated successfully!');
      navigate('/accounts');
    } catch (error: unknown) {
      let errorMessage = 'Failed to update account';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Error updating account:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <Loading message="Loading account..." />;
  }

  if (!account) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Account not found</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/accounts')}
            className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLongLeftIcon className="w-4 h-4 mr-1" />
            Back to Accounts
          </button>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Account</h2>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                defaultValue={account.name}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type
              </label>
              <select
                id="type"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                name="type"
                defaultValue={account.type}
                required
              >
                <option value="checking">Checking Account</option>
                <option value="savings">Savings Account</option>
                <option value="investment">Investment</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Balance
            </label>
            <input
              id="balance"
              type="number"
              step="0.01"
              value={account.balance}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm text-gray-500 dark:text-gray-400"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Balance cannot be edited directly. Use transactions to modify the balance.
            </p>
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="color"
                name="color"
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="mt-1 block w-32 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="#cccccc"
                maxLength={7}
                pattern="#?[0-9A-Fa-f]{6}"
                required
              />
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 border-0 p-0 bg-transparent"
                style={{ cursor: 'pointer' }}
                tabIndex={-1}
              />
            </div>
            {colorError && <div className="text-red-500 dark:text-red-400 text-xs mt-1">{colorError}</div>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {isLoading ? 'Saving...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 