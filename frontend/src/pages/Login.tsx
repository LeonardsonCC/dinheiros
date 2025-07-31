import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', data);
      
      localStorage.setItem('token', response.data.token);
      toast.success('Logged in successfully!');

      // Force a full page reload to ensure all state is properly initialized
      window.location.href = '/';
    } catch (error) {
      toast.error('Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error('Google login failed: No credential');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/google', {
        credential: credentialResponse.credential,
      });
      localStorage.setItem('token', response.data.token);
      toast.success('Logged in with Google!');
      window.location.href = '/';
    } catch (error) {
      toast.error('Google login failed');
      console.error('Google login error:', error);
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
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200"
              >
                create a new account
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
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
                  autoComplete="current-password"
                  className="glass-input relative block w-full px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
                  placeholder="Password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">{errors.password.message}</p>
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
                {isLoading ? 'Signing in...' : 'Sign in'}
              </GlassButton>
            </div>
          </form>
          <div className="flex flex-col items-center mt-6">
            <span className="mb-4 text-gray-500 dark:text-gray-400">or</span>
            <div className="w-full">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() => toast.error('Google login failed')}
                useOneTap
                width="100%"
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
