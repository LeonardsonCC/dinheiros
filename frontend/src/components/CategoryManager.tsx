import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  description: string;
  type: TransactionType;
}

interface CategoryManagerProps {
  initialType?: TransactionType;
  onCategoryAdded: (category: Category) => void;
  buttonVariant?: 'default' | 'icon'; // add this prop
  buttonClassName?: string; // allow custom class
}

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function CategoryManager({ initialType = 'expense', onCategoryAdded, buttonVariant = 'default', buttonClassName }: CategoryManagerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent forms
    
    if (!name.trim()) {
      toast.error(t('categoryManager.nameRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/categories', {
        name: name.trim(),
        description: description.trim(),
        type: type
      });
      
      onCategoryAdded(response.data);
      toast.success(t('categoryManager.added'));
      closeModal();
    } catch (error: unknown) {
      let errorMessage = t('categoryManager.failed');
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as AxiosError;
        if (typeof err.response?.data?.message === 'string') {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Error creating category:', error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setName('');
    setDescription('');
    setType('expense');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex justify-between items-center mb-2">
        {buttonVariant === 'icon' ? (
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 rounded-full ${buttonClassName || ''}`}
              title={t('categoryManager.addCategory')}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        ) : (
          <>
            <span className="block text-sm font-medium">
              {t('categoryManager.categories')}
            </span>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                {t('categoryManager.addCategory')}
              </Button>
            </DialogTrigger>
          </>
        )}
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('categoryManager.addNew')}</DialogTitle>
          <DialogDescription>
            Create a new category for organizing your transactions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category-name">
              {t('categoryManager.name')} *
            </Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categoryManager.namePlaceholder')}
              required
            />
          </div>
          <div>
            <Label htmlFor="category-description">
              {t('categoryManager.description')}
            </Label>
            <Textarea
              id="category-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('categoryManager.descriptionPlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="category-type">
              {t('categoryManager.type')} *
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t('dashboard.expenses')}</SelectItem>
                <SelectItem value="income">{t('dashboard.income')}</SelectItem>

              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('categoryManager.adding') : t('categoryManager.addCategory')}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              {t('categoryManager.cancel')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
