import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  
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

  const onGoogleSuccess = async (credentialResponse: { credential?: string }) => {
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
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              create a new account
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => toast.error('Google login failed')}
            useOneTap
            width="100%"
          />
        </CardContent>
      </Card>
    </div>
  );
}
