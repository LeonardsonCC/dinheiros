import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function NewAccount() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      currency: formData.get('currency') as string,
      initial_balance: Number(formData.get('initial_balance'))
    };
    try {
      setIsLoading(true);
      await api.post('/api/accounts', data);
      toast.success('Account created successfully!');
      navigate('/accounts');
    } catch (error: any) {
      console.error('Error creating account:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create account';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Account</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                id="name"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                name="name"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                name="type"
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
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              id="currency"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              name="currency"
              required
            >
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>

          </div>

          <div>
            <label htmlFor="initial_balance" className="block text-sm font-medium text-gray-700">
              Initial Balance
            </label>
            <input
              id="initial_balance"
              type="number"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              name="initial_balance"
              required
            />

          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
