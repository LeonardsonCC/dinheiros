import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@/components/ui';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = z.object({
    email: z.string().email(t('login.validation.invalidEmail')),
    password: z.string().min(6, t('login.validation.passwordMinLength')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', data);
      
      localStorage.setItem('token', response.data.token);
      toast.success(t('login.loggedInSuccess'));

      // Force a full page reload to ensure all state is properly initialized
      window.location.href = '/';
    } catch (error) {
      toast.error(t('login.invalidCredentials'));
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error(t('login.googleLoginNoCredential'));
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/google', {
        credential: credentialResponse.credential,
      });
      localStorage.setItem('token', response.data.token);
      toast.success(t('login.googleLoginSuccess'));
      window.location.href = '/';
    } catch (error) {
      toast.error(t('login.googleLoginFailed'));
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="fixed top-4 right-4 z-10">
        <LanguageSwitcher variant="header" showLabel={false} />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('login.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('login.subtitle')}{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              {t('login.createNewAccount')}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('login.emailPlaceholder')}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('login.passwordPlaceholder')}
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('login.signingIn') : t('login.signIn')}
              </Button>
            </form>
          </Form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('login.orContinueWith')}</span>
            </div>
          </div>
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => toast.error(t('login.googleLoginFailed'))}
            useOneTap
            width="100%"
          />
        </CardContent>
      </Card>
    </div>
  );
}
