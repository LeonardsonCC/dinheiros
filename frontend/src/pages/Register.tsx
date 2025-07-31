import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
      <GlassCard className="w-full max-w-md" variant="elevated" animation="scale-in">
        <div className="p-8 space-y-8">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 animate-fade-in">
              Create a new account
            </h2>
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200"
              >
                sign in to your account
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="glass-input relative block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  placeholder="Full Name"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  type="email"
                  autoComplete="email"
                  className="glass-input relative block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  placeholder="Email address"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="glass-input relative block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  placeholder="Password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className="glass-input relative block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  placeholder="Confirm Password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <GlassButton
                type="submit"
                disabled={isLoading}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
