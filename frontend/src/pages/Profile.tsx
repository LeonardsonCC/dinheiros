import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Schema for name update
const nameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type NameFormData = z.infer<typeof nameSchema>;

// Schema for password update
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Name form
  const { 
    register: registerName, 
    handleSubmit: handleNameSubmit, 
    formState: { errors: nameErrors } 
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
  });

  // Password form
  const { 
    register: registerPassword, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors },
    reset: resetPasswordForm
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onNameSubmit = async (data: NameFormData) => {
    try {
      setIsLoading(true);
      await api.patch('/api/users/me', { name: data.name });
      toast.success(t('profile.nameUpdated'));
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error(t('profile.failedUpdateName'));
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);
      await api.patch('/api/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t('profile.passwordUpdated'));
      resetPasswordForm();
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(t('profile.failedUpdatePassword'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t('profile.title')}</h1>
      
      {/* Update Name Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('profile.updateName')}</h2>
        <form onSubmit={handleNameSubmit(onNameSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.name')}
            </label>
            <input
              type="text"
              id="name"
              {...registerName('name')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled={isLoading}
              placeholder={t('profile.namePlaceholder')}
            />
            {nameErrors.name && (
              <p className="mt-1 text-sm text-red-600">{nameErrors.name.message}</p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? t('profile.updating') : t('profile.updateNameBtn')}
            </button>
          </div>
        </form>
      </div>

      {/* Update Password Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('profile.changePassword')}</h2>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.currentPassword')}
            </label>
            <input
              type="password"
              id="currentPassword"
              {...registerPassword('currentPassword')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled={isLoading}
              placeholder={t('profile.currentPasswordPlaceholder')}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.newPassword')}
            </label>
            <input
              type="password"
              id="newPassword"
              {...registerPassword('newPassword')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled={isLoading}
              placeholder={t('profile.newPasswordPlaceholder')}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...registerPassword('confirmPassword')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              disabled={isLoading}
              placeholder={t('profile.confirmPasswordPlaceholder')}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? t('profile.updating') : t('profile.updatePasswordBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
