import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

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
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 animate-fade-in">{t('profile.title')}</h1>
        
        {/* Update Name Section */}
        <GlassCard variant="elevated" animation="slide-up">
          <div className="p-6">
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
              className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
              disabled={isLoading}
              placeholder={t('profile.namePlaceholder')}
            />
            {nameErrors.name && (
              <p className="mt-1 text-sm text-red-600">{nameErrors.name.message}</p>
            )}
          </div>
          <div>
            <GlassButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="md"
            >
              {isLoading ? t('profile.updating') : t('profile.updateNameBtn')}
            </GlassButton>
          </div>
        </form>
          </div>
        </GlassCard>

        {/* Update Password Section */}
        <GlassCard variant="elevated" animation="slide-up">
          <div className="p-6">
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
              className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
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
              className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
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
              className="glass-input mt-1 block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
              disabled={isLoading}
              placeholder={t('profile.confirmPasswordPlaceholder')}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>
          
          <div>
            <GlassButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="md"
            >
              {isLoading ? t('profile.updating') : t('profile.updatePasswordBtn')}
            </GlassButton>
          </div>
        </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
