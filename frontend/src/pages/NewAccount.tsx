import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

function isValidHexColor(color: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export default function NewAccount() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [color, setColor] = useState('#cccccc');
  const [colorError, setColorError] = useState('');

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
      initial_balance: Number(formData.get('initial_balance')),
      color: colorValue
    };
    try {
      setIsLoading(true);
      await api.post('/api/accounts', data);
      toast.success('Account created successfully!');
      navigate('/accounts');
    } catch (error: unknown) {
      let errorMessage = 'Failed to create account';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Error creating account:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
      <GlassCard className="w-full max-w-2xl" variant="elevated" animation="slide-up">
        <div className="p-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-8 animate-fade-in">Add New Account</h2>
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
                required
                className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type
              </label>
              <select
                id="type"
                className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
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
            <label htmlFor="initial_balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Initial Balance
            </label>
            <input
              id="initial_balance"
              type="number"
              step="0.01"
              className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
              name="initial_balance"
            />
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
                className="glass-input mt-1 block w-32 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
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
            {colorError && <div className="text-red-500 dark:text-red-400 text-xs mt-1 animate-fade-in">{colorError}</div>}
          </div>

          <div className="flex justify-end space-x-3">
            <GlassButton
              type="button"
              onClick={() => navigate('/accounts')}
              variant="secondary"
              size="md"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="md"
            >
              {isLoading ? 'Saving...' : 'Save Account'}
            </GlassButton>
          </div>
        </form>
        </div>
      </GlassCard>
    </div>
  );
}
