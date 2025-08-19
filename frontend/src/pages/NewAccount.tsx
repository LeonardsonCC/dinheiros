import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Button, Card, CardContent, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MoneyInput } from '@/components/ui/money-input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}



type AccountFormData = {
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit_card' | 'cash';
  initial_balance?: string;
  color: string;
};

export default function NewAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const accountSchema = z.object({
    name: z.string().min(1, t('newAccount.validationErrors.nameRequired')),
    type: z.enum(['checking', 'savings', 'investment', 'credit_card', 'cash']),
    initial_balance: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('newAccount.validationErrors.invalidHexColor'))
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'checking',
      initial_balance: '',
      color: '#cccccc'
    }
  });

  const watchedColor = form.watch('color');

  const onSubmit = async (data: AccountFormData) => {
    const payload = {
      name: data.name,
      type: data.type,
      initial_balance: data.initial_balance ? Number(data.initial_balance) : 0,
      color: data.color
    };
    
    try {
      setIsLoading(true);
      await api.post('/api/accounts', payload);
      toast.success(t('newAccount.messages.created'));
      navigate('/accounts');
    } catch (error: unknown) {
      let errorMessage = t('newAccount.messages.failedToCreate');
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
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('newAccount.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('newAccount.accountName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('newAccount.accountNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('newAccount.accountType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="checking">{t('newAccount.accountTypes.checking')}</SelectItem>
                          <SelectItem value="savings">{t('newAccount.accountTypes.savings')}</SelectItem>
                          <SelectItem value="investment">{t('newAccount.accountTypes.investment')}</SelectItem>
                          <SelectItem value="credit_card">{t('newAccount.accountTypes.credit_card')}</SelectItem>
                          <SelectItem value="cash">{t('newAccount.accountTypes.cash')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                <FormField
                control={form.control}
                name="initial_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newAccount.initialBalance')}</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={parseFloat(field.value || '0') || 0}
                        onChange={(value) => field.onChange(value.toString())}
                        placeholder="0,00"
                        allowNegative={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newAccount.accountColor')}</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input
                          type="text"
                          placeholder={t('newAccount.accountColorPlaceholder')}
                          maxLength={7}
                          className="w-32"
                          {...field}
                        />
                      </FormControl>
                      <input
                        type="color"
                        value={watchedColor}
                        onChange={(e) => form.setValue('color', e.target.value)}
                        className="w-8 h-8 border-0 p-0 bg-transparent cursor-pointer"
                        tabIndex={-1}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/accounts')}
                >
                  {t('newAccount.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('newAccount.saving') : t('newAccount.saveAccount')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
