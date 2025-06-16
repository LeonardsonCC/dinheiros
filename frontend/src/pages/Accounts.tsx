import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Account {
  id: number | string;
  _id?: string;
  ID?: string | number;
  name: string;
  accountName?: string;
  balance: number;
  currentBalance?: number;
  currency: string;
  currencyCode?: string;
}

// Internal type for the processed account data
interface ProcessedAccount {
  id: number | string;
  name: string;
  balance: number;
  currency: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<ProcessedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/api/accounts');
        console.log('Raw API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response data type:', typeof response.data);
        console.log('Accounts in response:', response.data.accounts || response.data.data || response.data);
        
        // Log the raw response structure for debugging
        console.log('Raw response structure:', JSON.stringify(response.data, null, 2));
        
        // Handle different possible response formats
        let accountsData: Account[] = [];
        
        if (response.data) {
          // Case 1: Response has an 'accounts' array
          if (Array.isArray(response.data.accounts)) {
            accountsData = response.data.accounts;
          } 
          // Case 2: Response has a 'data' array
          else if (Array.isArray(response.data.data)) {
            accountsData = response.data.data;
          }
          // Case 3: Response is an array
          else if (Array.isArray(response.data)) {
            accountsData = response.data;
          }
          // Case 4: Response is a single account object
          else if (response.data.id || response.data._id || response.data.ID) {
            accountsData = [response.data];
          }
        }
        
        // Map the accounts to ensure consistent field names and types
        accountsData = accountsData.map(account => {
          // Ensure we have a valid ID
          const accountId = account.id || account._id || account.ID;
          if (!accountId) {
            console.warn('Account missing ID:', account);
            return null;
          }
          
          return {
            id: accountId,
            name: account.name || account.accountName || 'Unnamed Account',
            balance: account.balance || account.currentBalance || 0,
            currency: account.currency || account.currencyCode || 'USD'
          };
        }).filter((account): account is ProcessedAccount => account !== null);
        
        console.log('Processed accounts data:', accountsData);
        // Log each account's ID to verify they exist
        accountsData.forEach((account, index) => {
          console.log(`Account ${index + 1}:`, {
            id: account.id,
            name: account.name,
            balance: account.balance,
            currency: account.currency
          });
        });
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load accounts';
        toast.error(errorMessage);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading accounts...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
        <Link
          to="/accounts/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
          Add Account
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Link
            key={account.id}
            to={`/accounts/${account.id}/transactions`}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
              <span className="text-sm text-gray-500">{account.currency}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: account.currency || 'USD',
              }).format(account.balance || 0)}
            </p>
            <div className="mt-4 text-sm text-primary-600 hover:text-primary-800">
              View transactions →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
